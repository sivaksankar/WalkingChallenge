import SwiftUI

struct DashboardView: View {
    let session: SessionSnapshot
    let onSignOut: () -> Void

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

            VStack(spacing: 12) {
                Text("Apple Health")
                    .font(.headline)
                Text("Connect Apple Health to sync your latest steps and compete on the leaderboard.")
                    .multilineTextAlignment(.center)
                    .foregroundColor(.secondary)
            }
            .padding()
            .frame(maxWidth: .infinity)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color(.secondarySystemBackground))
            )

            Spacer()
        }
        .padding(24)
        .navigationTitle("Dashboard")
    }
}
