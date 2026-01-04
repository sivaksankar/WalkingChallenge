import Foundation
import SwiftUI
import os.log

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
    let healthManager: AppleHealthManager

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
        os_log("Starting sign in flow", log: .default, type: .info)
        Task {
            do {
                os_log("Calling authService.startSignIn()", log: .default, type: .info)
                let response = try await authService.startSignIn()
                os_log("Received auth response", log: .default, type: .info)
                
                let payload: SessionPayload
                if let inlinePayload = response.payload {
                    os_log("Using inline session payload from callback", log: .default, type: .info)
                    print("✅ Using inline session payload from callback")
                    payload = inlinePayload
                } else if let code = response.code {
                    os_log("Exchanging authorization code", log: .default, type: .info)
                    payload = try await authService.exchangeAuthorizationCode(code)
                    os_log("Successfully exchanged authorization code", log: .default, type: .info)
                } else {
                    os_log("Missing both code and payload", log: .default, type: .error)
                    throw AuthService.AuthError.missingCode
                }
                
                let snapshot = SessionSnapshot(
                    accessToken: payload.tokens.accessToken,
                    refreshToken: payload.tokens.refreshToken,
                    expiresAt: Date().addingTimeInterval(payload.tokens.expiresIn),
                    user: payload.profile
                )
                sessionStore.store(snapshot)
                os_log("Session stored successfully", log: .default, type: .info)
                phase = .signedIn(snapshot)
                isBusy = false
                
                // Don't auto-show health permissions - let user initiate from dashboard
                // This avoids presentation conflicts with OAuth flow
            } catch {
                os_log("Sign in failed: %{public}@", log: .default, type: .error, error.localizedDescription)
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
            print("✅ Health permissions granted")
            
            // Sync today's steps to backend
            try await healthManager.syncLatestSteps(session: session)
            print("✅ Initial step sync complete")
        } catch {
            print("❌ Health setup error: \(error.localizedDescription)")
            errorMessage = error.localizedDescription
        }
        isBusy = false
    }

    func clearError() {
        errorMessage = nil
    }
}
