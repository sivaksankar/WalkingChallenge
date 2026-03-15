import Foundation
import HealthKit

struct DailyStep: Identifiable {
    let id = UUID()
    let date: Date
    let steps: Int

    var dayLabel: String {
        let f = DateFormatter()
        f.dateFormat = "EEE"
        return f.string(from: date)
    }
}

@MainActor
final class AppleHealthManager {
    enum HealthError: Error, LocalizedError {
        case notAvailable
        case authorizationDenied
        case integrationPending

        var errorDescription: String? {
            switch self {
            case .notAvailable:
                return "Apple Health is not available on this device."
            case .authorizationDenied:
                return "We were not able to access your Apple Health step data."
            case .integrationPending:
                return "Apple Health sync has not been implemented yet."
            }
        }
    }

    private let healthStore = HKHealthStore()

    var isAvailable: Bool {
        HKHealthStore.isHealthDataAvailable()
    }

    func requestAuthorization() async throws {
        guard isAvailable else { throw HealthError.notAvailable }
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
            throw HealthError.notAvailable
        }
        let readTypes: Set<HKObjectType> = [stepType]
        let shareTypes: Set<HKSampleType> = []

        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            healthStore.requestAuthorization(toShare: shareTypes, read: readTypes) { granted, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }
                guard granted else {
                    continuation.resume(throwing: HealthError.authorizationDenied)
                    return
                }
                continuation.resume(returning: ())
            }
        }
    }

    func fetchRecentSteps() async -> [DailyStep] {
        guard isAvailable, let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
            return []
        }
        let calendar = Calendar.current
        let now = Date()
        let startOfToday = calendar.startOfDay(for: now)
        guard let startDate = calendar.date(byAdding: .day, value: -6, to: startOfToday) else { return [] }

        let query = HKStatisticsCollectionQuery(
            quantityType: stepType,
            quantitySamplePredicate: HKQuery.predicateForSamples(withStart: startDate, end: now),
            options: .cumulativeSum,
            anchorDate: startOfToday,
            intervalComponents: DateComponents(day: 1)
        )

        return await withCheckedContinuation { continuation in
            query.initialResultsHandler = { _, results, _ in
                var entries: [DailyStep] = []
                results?.enumerateStatistics(from: startDate, to: now) { stats, _ in
                    let steps = Int(stats.sumQuantity()?.doubleValue(for: .count()) ?? 0)
                    entries.append(DailyStep(date: stats.startDate, steps: steps))
                }
                continuation.resume(returning: entries)
            }
            healthStore.execute(query)
        }
    }

    func syncLatestSteps(session: SessionSnapshot) async throws {
        guard isAvailable else { throw HealthError.notAvailable }
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
            throw HealthError.notAvailable
        }

        // Query steps for each of the last 7 days
        let calendar = Calendar.current
        let now = Date()
        let startOfToday = calendar.startOfDay(for: now)
        guard let startDate = calendar.date(byAdding: .day, value: -6, to: startOfToday) else { return }

        let interval = DateComponents(day: 1)
        let query = HKStatisticsCollectionQuery(
            quantityType: stepType,
            quantitySamplePredicate: HKQuery.predicateForSamples(withStart: startDate, end: now),
            options: .cumulativeSum,
            anchorDate: startOfToday,
            intervalComponents: interval
        )

        let stepsByDate: [(date: String, steps: Int)] = try await withCheckedThrowingContinuation { continuation in
            query.initialResultsHandler = { _, results, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }
                var entries: [(date: String, steps: Int)] = []
                let formatter = ISO8601DateFormatter()
                formatter.formatOptions = [.withFullDate]
                results?.enumerateStatistics(from: startDate, to: now) { stats, _ in
                    let steps = Int(stats.sumQuantity()?.doubleValue(for: .count()) ?? 0)
                    if steps > 0 {
                        entries.append((date: formatter.string(from: stats.startDate), steps: steps))
                    }
                }
                continuation.resume(returning: entries)
            }
            healthStore.execute(query)
        }

        guard !stepsByDate.isEmpty else { return }

        // Sync each day's steps to the server
        let baseURL = URL(string: "https://nextjs-app-409798850238.us-central1.run.app")!
        let syncURL = baseURL.appending(path: "/api/mobile/health/sync")
        for entry in stepsByDate {
            var req = URLRequest(url: syncURL)
            req.httpMethod = "POST"
            req.addValue("application/json", forHTTPHeaderField: "Content-Type")
            req.addValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
            req.httpBody = try JSONSerialization.data(withJSONObject: [
                "steps": entry.steps,
                "date": entry.date,
            ])
            let (_, response) = try await URLSession.shared.data(for: req)
            if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
                print("[HealthSync] Server returned \(http.statusCode) for date \(entry.date)")
            }
        }
    }
}
