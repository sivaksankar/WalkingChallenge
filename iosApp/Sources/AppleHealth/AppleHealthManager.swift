import Foundation
import HealthKit

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

    func syncLatestSteps(session: SessionSnapshot) async throws {
        throw HealthError.integrationPending
    }
}
