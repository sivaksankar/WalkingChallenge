import SwiftUI

@main
struct WalkingChallengeApp: App {
    @StateObject private var authViewModel: AuthViewModel

    init() {
        let config = AuthConfiguration.defaultConfig
        let authService = AuthService(configuration: config)
        let sessionStore = SessionStore()
        let healthManager = AppleHealthManager()
        _authViewModel = StateObject(wrappedValue: AuthViewModel(
            authService: authService,
            sessionStore: sessionStore,
            healthManager: healthManager
        ))
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(authViewModel)
        }
    }
}
