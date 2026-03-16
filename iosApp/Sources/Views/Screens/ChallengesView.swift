import SwiftUI

struct ChallengesView: View {
    let session: SessionSnapshot
    @StateObject private var vm = ChallengesViewModel()

    var body: some View {
        List {
            if !vm.myChallenges.isEmpty {
                Section("My Challenges") {
                    ForEach(vm.myChallenges) { c in
                        challengeRow(c, joined: true)
                    }
                }
            }

            Section("All Challenges") {
                if vm.allChallenges.isEmpty && !vm.isLoading {
                    Text("No active challenges")
                        .foregroundColor(.secondary)
                } else {
                    ForEach(vm.allChallenges) { c in
                        let joined = vm.myChallenges.contains { $0.id == c.id }
                        challengeRow(c, joined: joined)
                    }
                }
            }
        }
        .navigationTitle("Challenges")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(.visible, for: .navigationBar)
        .overlay {
            if vm.isLoading { ProgressView() }
        }
        .alert("Error", isPresented: Binding(
            get: { vm.errorMessage != nil },
            set: { if !$0 { vm.errorMessage = nil } }
        )) {
            Button("OK") { vm.errorMessage = nil }
        } message: {
            Text(vm.errorMessage ?? "")
        }
        .task { await vm.load(session: session) }
        .refreshable { await vm.load(session: session) }
    }

    private func challengeRow(_ c: Challenge, joined: Bool) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(c.name)
                    .font(.headline)
                Spacer()
                if joined {
                    Label("Joined", systemImage: "checkmark.circle.fill")
                        .font(.caption)
                        .foregroundColor(.green)
                } else {
                    Button("Join") {
                        Task { await vm.join(challengeId: c.id, session: session) }
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.small)
                }
            }
            if let desc = c.description, !desc.isEmpty {
                Text(desc)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            HStack(spacing: 16) {
                if let min = c.minSteps {
                    Label("\(min.formatted()) steps/day", systemImage: "figure.walk")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                Label("\(c.participantCount) joined", systemImage: "person.2")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}
