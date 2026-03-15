import SwiftUI

struct RootView: View {
    @EnvironmentObject private var authViewModel: AuthViewModel

    var body: some View {
        NavigationStack {
            content
        }
        .sheet(isPresented: Binding(
            get: { authViewModel.requiresHealthPermission },
            set: { newValue in
                if !newValue {
                    authViewModel.markHealthPermissionComplete()
                }
            }
        )) {
            HealthPermissionsView(
                isLoading: authViewModel.isBusy,
                isAppleHealthAvailable: authViewModel.isAppleHealthAvailable,
                onConnect: { authViewModel.requestHealthPermissions() },
                onSkip: {
                    authViewModel.markHealthPermissionComplete()
                }
            )
        }
        .alert(isPresented: Binding<Bool>(
            get: { authViewModel.errorMessage != nil },
            set: { newValue in
                if !newValue {
                    authViewModel.clearError()
                }
            }
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
            SignInView(isLoading: authViewModel.isBusy) {
                authViewModel.signIn()
            }
        case .signedIn(let session):
            DashboardView(
                session: session,
                isHealthConnected: authViewModel.isHealthConnected,
                recentSteps: authViewModel.recentSteps,
                onSignOut: { authViewModel.signOut() }
            )
        }
    }
}
