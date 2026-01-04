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
                
                // Show health permissions sheet after successful sign-in
                // The actual permission request happens when user taps Connect button
                if healthManager.isAvailable {
                    // Delay to ensure auth modal fully dismisses before showing health sheet
                    try await Task.sleep(nanoseconds: 1_000_000_000) // 1 second
                    requiresHealthPermission = true
                } else {
                    requiresHealthPermission = false
                }
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

    func requestHealthPermissions() async {
        guard !isBusy else { return }
        guard case let .signedIn(session) = phase else { return }
        isBusy = true
        do {
            guard healthManager.isAvailable else {
                throw AppleHealthManager.HealthError.notAvailable
            }
            try await healthManager.requestAuthorization()
            // Health permissions granted, mark as complete
            requiresHealthPermission = false
            
            // TODO: Implement step sync with backend
            // try await healthManager.syncLatestSteps(session: session)
        } catch {
            errorMessage = error.localizedDescription
        }
        isBusy = false
    }

    func clearError() {
        errorMessage = nil
    }
}
