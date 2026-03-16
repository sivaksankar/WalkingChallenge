import SwiftUI

struct ProfileView: View {
    let session: SessionSnapshot
    let isHealthConnected: Bool
    let onSignOut: () -> Void
    @StateObject private var vm = ChallengesViewModel()

    var body: some View {
        List {
            // User info
            Section {
                HStack(spacing: 16) {
                    Circle()
                        .fill(Color.blue.opacity(0.15))
                        .frame(width: 60, height: 60)
                        .overlay(
                            Text(session.user.name.prefix(1).uppercased())
                                .font(.title2.bold())
                                .foregroundColor(.blue)
                        )
                    VStack(alignment: .leading, spacing: 4) {
                        Text(session.user.name)
                            .font(.headline)
                        if let email = session.user.email {
                            Text(email)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                .padding(.vertical, 8)
            }

            // Health status
            Section("Connections") {
                HStack {
                    Image(systemName: isHealthConnected ? "heart.fill" : "heart")
                        .foregroundColor(isHealthConnected ? .green : .secondary)
                    Text("Apple Health")
                    Spacer()
                    Text(isHealthConnected ? "Connected" : "Not connected")
                        .foregroundColor(isHealthConnected ? .green : .secondary)
                        .font(.subheadline)
                }
            }

            // My challenges
            Section("My Challenges") {
                if vm.isLoading {
                    ProgressView()
                } else if vm.myChallenges.isEmpty {
                    Text("No challenges joined yet")
                        .foregroundColor(.secondary)
                } else {
                    ForEach(vm.myChallenges) { c in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(c.name).font(.headline)
                            if let min = c.minSteps {
                                Text("\(min.formatted()) steps/day")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding(.vertical, 2)
                    }
                }
            }

            // Sign out
            Section {
                Button(role: .destructive, action: onSignOut) {
                    HStack {
                        Spacer()
                        Text("Sign Out")
                        Spacer()
                    }
                }
            }
        }
        .navigationTitle("Profile")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(.visible, for: .navigationBar)
        .task { await vm.load(session: session) }
        .refreshable { await vm.load(session: session) }
    }
}
