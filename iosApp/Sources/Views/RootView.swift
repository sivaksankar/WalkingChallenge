import SwiftUI

struct RootView: View {
    @EnvironmentObject private var authViewModel: AuthViewModel

    var body: some View {
        content
            .sheet(isPresented: Binding(
                get: { authViewModel.requiresHealthPermission },
                set: { if !$0 { authViewModel.markHealthPermissionComplete() } }
            )) {
                HealthPermissionsView(
                    isLoading: authViewModel.isBusy,
                    isAppleHealthAvailable: authViewModel.isAppleHealthAvailable,
                    onConnect: { authViewModel.requestHealthPermissions() },
                    onSkip: { authViewModel.markHealthPermissionComplete() }
                )
            }
            .alert(isPresented: Binding<Bool>(
                get: { authViewModel.errorMessage != nil },
                set: { if !$0 { authViewModel.clearError() } }
            )) {
                Alert(
                    title: Text("Something went wrong"),
                    message: Text(authViewModel.errorMessage ?? "Unknown error"),
                    dismissButton: .default(Text("OK"), action: authViewModel.clearError)
                )
            }
    }

    @ViewBuilder
    private var content: some View {
        switch authViewModel.phase {
        case .splash:
            SplashView()
        case .signedOut:
            NavigationStack {
                SignInView(isLoading: authViewModel.isBusy) {
                    authViewModel.signIn()
                }
                .toolbar(.hidden, for: .navigationBar)
            }
        case .signedIn(let session):
            TabView {
                NavigationStack {
                    DashboardView(
                        session: session,
                        isHealthConnected: authViewModel.isHealthConnected,
                        recentSteps: authViewModel.recentSteps,
                        onSignOut: { authViewModel.signOut() }
                    )
                }
                .tabItem { Label("Home", systemImage: "house.fill") }

                NavigationStack {
                    ChallengesView(session: session)
                }
                .tabItem { Label("Challenges", systemImage: "trophy.fill") }

                NavigationStack {
                    LeaderboardView(session: session)
                }
                .tabItem { Label("Leaderboard", systemImage: "chart.bar.fill") }

                NavigationStack {
                    ProfileView(
                        session: session,
                        isHealthConnected: authViewModel.isHealthConnected,
                        onSignOut: { authViewModel.signOut() }
                    )
                }
                .tabItem { Label("Profile", systemImage: "person.fill") }
            }
        }
    }
}
