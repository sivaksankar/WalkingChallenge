import Foundation
import SwiftUI

@MainActor
final class AuthViewModel: ObservableObject {
    enum Phase {
        case splash
        case signedOut
        case signedIn(SessionSnapshot)
    }

    @Published private(set) var phase: Phase = .splash
    @Published var isBusy: Bool = false
    @Published var errorMessage: String?
    @Published var requiresHealthPermission: Bool = false
    @Published private(set) var isHealthConnected: Bool = false
    @Published private(set) var recentSteps: [DailyStep] = []

    private let authService: AuthService
    private let sessionStore: SessionStore
    private let healthManager: AppleHealthManager

    var isAppleHealthAvailable: Bool {
        healthManager.isAvailable
    }

    init(
        authService: AuthService,
        sessionStore: SessionStore,
        healthManager: AppleHealthManager
    ) {
        self.authService = authService
        self.sessionStore = sessionStore
        self.healthManager = healthManager
        loadSession()
    }

    func loadSession() {
        if let session = sessionStore.currentSession {
            phase = .signedIn(session)
            isHealthConnected = UserDefaults.standard.bool(forKey: "healthConnected")
            if isHealthConnected {
                Task { recentSteps = await healthManager.fetchRecentSteps() }
            }
        } else {
            phase = .signedOut
        }
    }

    func signIn() {
        guard !isBusy else { return }
        isBusy = true
        Task {
            do {
                let response = try await authService.startSignIn()
                let payload = try await authService.exchangeAuthorizationCode(response.code)
                let snapshot = SessionSnapshot(
                    accessToken: payload.tokens.accessToken,
                    refreshToken: payload.tokens.refreshToken,
                    expiresAt: Date().addingTimeInterval(payload.tokens.expiresIn),
                    user: payload.profile
                )
                sessionStore.store(snapshot)
                phase = .signedIn(snapshot)
                requiresHealthPermission = true
            } catch {
                errorMessage = error.localizedDescription
                phase = .signedOut
            }
            isBusy = false
        }
    }

    func signOut() {
        sessionStore.clear()
        UserDefaults.standard.removeObject(forKey: "healthConnected")
        isHealthConnected = false
        phase = .signedOut
    }

    func markHealthPermissionComplete() {
        requiresHealthPermission = false
    }

    func requestHealthPermissions() {
        guard !isBusy else { return }
        guard case let .signedIn(session) = phase else { return }
        isBusy = true
        Task {
            do {
                guard healthManager.isAvailable else {
                    throw AppleHealthManager.HealthError.notAvailable
                }
                try await healthManager.requestAuthorization()
                UserDefaults.standard.set(true, forKey: "healthConnected")
                isHealthConnected = true
                requiresHealthPermission = false
                // Sync to server and refresh chart data in the background
                Task {
                    async let sync: () = { try? await healthManager.syncLatestSteps(session: session) }()
                    async let steps = healthManager.fetchRecentSteps()
                    _ = await sync
                    recentSteps = await steps
                }
            } catch {
                errorMessage = error.localizedDescription
            }
            isBusy = false
        }
    }

    func clearError() {
        errorMessage = nil
    }
}
