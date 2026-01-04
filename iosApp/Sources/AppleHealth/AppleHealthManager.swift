import Foundation
import HealthKit

@MainActor
final class AppleHealthManager {
    // Disable mock mode for production release
    private let useMockData = false
    
    enum HealthError: Error, LocalizedError {
        case notAvailable
        case authorizationDenied
        case integrationPending
        case simulatorNotSupported
        case systemDaemonUnavailable

        var errorDescription: String? {
            switch self {
            case .notAvailable:
                return "Apple Health is not available on this device."
            case .authorizationDenied:
                return "We were not able to access your Apple Health step data."
            case .integrationPending:
                return "Apple Health sync has not been implemented yet."
            case .simulatorNotSupported:
                return "Apple Health requires a physical iOS device. Please run the app on a real iPhone or iPad."
            case .systemDaemonUnavailable:
                return "HealthKit system service is currently unavailable. This is a known issue on iOS beta versions. Please try updating to the latest iOS version or report to Apple Feedback."
            }
        }
    }

    private let healthStore = HKHealthStore()

    var isAvailable: Bool {
        HKHealthStore.isHealthDataAvailable()
    }

    func requestAuthorization() async throws {
        // Mock mode for iOS beta testing
        if useMockData {
            print("⚠️ Using mock HealthKit mode (iOS beta workaround)")
            try? await Task.sleep(nanoseconds: 1_000_000_000) // 1 second delay to simulate permission sheet
            print("✅ Mock HealthKit authorization granted")
            return
        }
        
        guard isAvailable else { throw HealthError.notAvailable }
        
        #if targetEnvironment(simulator)
        print("⚠️ HealthKit does not work on iOS Simulator")
        throw HealthError.simulatorNotSupported
        #endif
        
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
            throw HealthError.notAvailable
        }
        
        print("🏥 Requesting HealthKit authorization...")
        print("🏥 Step type: \(stepType)")
        
        let readTypes: Set<HKObjectType> = [stepType]
        
        return try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            healthStore.requestAuthorization(toShare: nil, read: readTypes) { success, error in
                DispatchQueue.main.async {
                    if let error = error {
                        let nsError = error as NSError
                        print("❌ HealthKit error domain: \(nsError.domain)")
                        print("❌ HealthKit error code: \(nsError.code)")
                        print("❌ HealthKit error: \(error.localizedDescription)")
                        print("❌ HealthKit error details: \(nsError.userInfo)")
                        
                        if nsError.domain == NSCocoaErrorDomain && nsError.code == 4097 {
                            continuation.resume(throwing: HealthError.systemDaemonUnavailable)
                        } else {
                            continuation.resume(throwing: error)
                        }
                        return
                    }
                    print("✅ HealthKit authorization completed, success: \(success)")
                    continuation.resume(returning: ())
                }
            }
        }
    }

    func syncLatestSteps(session: SessionSnapshot) async throws {
        if useMockData {
            let mockSteps = Int.random(in: 5000...15000)
            print("⚠️ Mock mode: Would sync \(mockSteps) steps to backend")
            print("📊 Session ID: \(session.user.id)")
            print("📊 Access Token: \(session.accessToken.prefix(20))...")
            return
        }
        
        guard isAvailable else { throw HealthError.notAvailable }
        
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
            throw HealthError.notAvailable
        }
        
        // Get today's steps
        let now = Date()
        let startOfDay = Calendar.current.startOfDay(for: now)
        
        let predicate = HKQuery.predicateForSamples(
            withStart: startOfDay,
            end: now,
            options: .strictStartDate
        )
        
        let query = HKStatisticsQuery(
            quantityType: stepType,
            quantitySamplePredicate: predicate,
            options: .cumulativeSum
        ) { _, result, error in
            Task { @MainActor in
                if let error = error {
                    print("❌ Failed to fetch steps: \(error.localizedDescription)")
                    return
                }
                
                guard let result = result,
                      let sum = result.sumQuantity() else {
                    print("⚠️ No step data available")
                    return
                }
                
                let steps = Int(sum.doubleValue(for: HKUnit.count()))
                print("📊 Fetched \(steps) steps for today")
                
                // Send to backend
                await self.sendStepsToBackend(steps: steps, date: startOfDay, session: session)
            }
        }
        
        healthStore.execute(query)
    }
    
    private func sendStepsToBackend(steps: Int, date: Date, session: SessionSnapshot) async {
        guard let url = URL(string: "\(AuthConfiguration.defaultConfig.webBaseURL)/api/steps/sync") else {
            print("❌ Invalid backend URL")
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let dateFormatter = ISO8601DateFormatter()
        let payload: [String: Any] = [
            "steps": steps,
            "date": dateFormatter.string(from: date),
            "source": "apple_health"
        ]
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: payload)
            let (data, response) = try await URLSession.shared.data(for: request)
            
            if let httpResponse = response as? HTTPURLResponse {
                if httpResponse.statusCode == 200 {
                    print("✅ Successfully synced \(steps) steps to backend")
                } else {
                    print("⚠️ Backend returned status code: \(httpResponse.statusCode)")
                    if let responseBody = String(data: data, encoding: .utf8) {
                        print("Response: \(responseBody)")
                    }
                }
            }
        } catch {
            print("❌ Failed to sync steps to backend: \(error.localizedDescription)")
        }
    }
}
