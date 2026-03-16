import SwiftUI

struct LeaderboardView: View {
    let session: SessionSnapshot
    @StateObject private var vm = ChallengesViewModel()

    var body: some View {
        List {
            ForEach(Array(vm.leaderboard.enumerated()), id: \.element.id) { index, entry in
                HStack(spacing: 12) {
                    // Rank
                    Text("\(index + 1)")
                        .font(.headline.monospacedDigit())
                        .foregroundColor(rankColor(index))
                        .frame(width: 28, alignment: .center)

                    // Avatar initial
                    Circle()
                        .fill(rankColor(index).opacity(0.15))
                        .frame(width: 40, height: 40)
                        .overlay(
                            Text(entry.name.prefix(1).uppercased())
                                .font(.headline)
                                .foregroundColor(rankColor(index))
                        )

                    VStack(alignment: .leading, spacing: 2) {
                        HStack {
                            Text(entry.name)
                                .font(.headline)
                            if entry.id == session.user.id {
                                Text("You")
                                    .font(.caption2.bold())
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 2)
                                    .background(Color.blue.opacity(0.15))
                                    .foregroundColor(.blue)
                                    .clipShape(Capsule())
                            }
                        }
                        Text("\(entry.steps.formatted()) steps today")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }

                    Spacer()

                    if index == 0 {
                        Text("🥇")
                    } else if index == 1 {
                        Text("🥈")
                    } else if index == 2 {
                        Text("🥉")
                    }
                }
                .padding(.vertical, 4)
            }
        }
        .navigationTitle("Leaderboard")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(.visible, for: .navigationBar)
        .overlay {
            if vm.isLoading { ProgressView() }
            else if vm.leaderboard.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "chart.bar")
                        .font(.largeTitle)
                        .foregroundColor(.secondary)
                    Text("No data yet")
                        .font(.headline)
                    Text("Check back after steps sync")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
            }
        }
        .task { await vm.load(session: session) }
        .refreshable { await vm.load(session: session) }
    }

    private func rankColor(_ index: Int) -> Color {
        switch index {
        case 0: return .yellow
        case 1: return Color(.systemGray)
        case 2: return .orange
        default: return .blue
        }
    }
}
