import SwiftUI

struct DashboardView: View {
    let session: SessionSnapshot
    let onSignOut: () -> Void
    @EnvironmentObject private var authViewModel: AuthViewModel

    var body: some View {
        VStack(spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Welcome back")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    Text(session.user.name)
                        .font(.title.bold())
                }
                Spacer()
                Button("Sign Out", action: onSignOut)
                    .buttonStyle(.bordered)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            if authViewModel.isAppleHealthAvailable {
                VStack(spacing: 12) {
                    Text("Apple Health")
                        .font(.headline)
                    Text("Connect Apple Health to sync your latest steps and compete on the leaderboard.")
                        .multilineTextAlignment(.center)
                        .foregroundColor(.secondary)
                    
                    Button {
                        authViewModel.requiresHealthPermission = true
                    } label: {
                        Text("Connect Apple Health")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                }
                .padding()
                .frame(maxWidth: .infinity)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color(.secondarySystemBackground))
                )
            }

            Spacer()
        }
        .padding(24)
        .navigationTitle("Dashboard")
    }
}
