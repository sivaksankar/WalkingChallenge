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
                let payload: SessionPayload
                if let inlinePayload = response.payload {
                    print("✅ Using inline session payload from callback")
                    payload = inlinePayload
                } else if let code = response.code {
                    payload = try await authService.exchangeAuthorizationCode(code)
                } else {
                    throw AuthService.AuthError.missingCode
                }
                let snapshot = SessionSnapshot(
                    accessToken: payload.tokens.accessToken,
                    refreshToken: payload.tokens.refreshToken,
                    expiresAt: Date().addingTimeInterval(payload.tokens.expiresIn),
                    user: payload.profile
                )
                sessionStore.store(snapshot)
                phase = .signedIn(snapshot)
                isBusy = false
                
                // Don't auto-show health permissions - let user initiate from dashboard
                // This avoids presentation conflicts with OAuth flow
            } catch {
                errorMessage = error.localizedDescription
                phase = .signedOut
                isBusy = false
            }
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
        
        // Dismiss the sheet first
        await MainActor.run {
            requiresHealthPermission = false
        }
        
        // Wait for sheet to fully dismiss
        try? await Task.sleep(nanoseconds: 500_000_000) // 0.5 seconds
        
        isBusy = true
        do {
            guard healthManager.isAvailable else {
                throw AppleHealthManager.HealthError.notAvailable
            }
            try await healthManager.requestAuthorization()
            print("✅ Health permissions setup complete")
            
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
