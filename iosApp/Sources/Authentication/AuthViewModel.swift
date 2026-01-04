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
                try await healthManager.syncLatestSteps(session: session)
                requiresHealthPermission = false
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
