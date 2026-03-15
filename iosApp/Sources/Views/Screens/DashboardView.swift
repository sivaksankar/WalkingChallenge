import SwiftUI
import Charts

struct DashboardView: View {
    let session: SessionSnapshot
    let isHealthConnected: Bool
    let recentSteps: [DailyStep]
    let onSignOut: () -> Void

    private var totalSteps: Int { recentSteps.reduce(0) { $0 + $1.steps } }
    private var todaySteps: Int { recentSteps.last?.steps ?? 0 }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Header
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

                // Health status
                HStack(spacing: 12) {
                    Image(systemName: isHealthConnected ? "heart.fill" : "heart")
                        .foregroundColor(isHealthConnected ? .green : .secondary)
                        .font(.title2)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Apple Health")
                            .font(.headline)
                        Text(isHealthConnected ? "Connected — steps are syncing" : "Not connected")
                            .font(.subheadline)
                            .foregroundColor(isHealthConnected ? .green : .secondary)
                    }
                    Spacer()
                }
                .padding()
                .frame(maxWidth: .infinity)
                .background(RoundedRectangle(cornerRadius: 16).fill(Color(.secondarySystemBackground)))

                if isHealthConnected && !recentSteps.isEmpty {
                    // Today + 7-day total
                    HStack(spacing: 12) {
                        statCard(title: "Today", value: todaySteps.formatted(), icon: "figure.walk")
                        statCard(title: "7-Day Total", value: totalSteps.formatted(), icon: "flame.fill")
                    }

                    // Bar chart
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Last 7 Days")
                            .font(.headline)
                            .padding(.horizontal, 4)

                        Chart(recentSteps) { entry in
                            BarMark(
                                x: .value("Day", entry.dayLabel),
                                y: .value("Steps", entry.steps)
                            )
                            .foregroundStyle(
                                entry.date.isToday ? Color.blue : Color.blue.opacity(0.5)
                            )
                            .cornerRadius(6)
                        }
                        .chartYAxis {
                            AxisMarks(position: .leading, values: .automatic(desiredCount: 4)) { value in
                                AxisValueLabel {
                                    if let steps = value.as(Int.self) {
                                        Text(steps >= 1000 ? "\(steps / 1000)k" : "\(steps)")
                                            .font(.caption)
                                    }
                                }
                                AxisGridLine()
                            }
                        }
                        .frame(height: 200)
                        .padding(12)
                        .background(RoundedRectangle(cornerRadius: 16).fill(Color(.secondarySystemBackground)))
                    }
                }

                Spacer(minLength: 32)
            }
            .padding(24)
        }
        .navigationTitle("Dashboard")
    }

    private func statCard(title: String, value: String, icon: String) -> some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(.blue)
            Text(value)
                .font(.title2.bold())
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(RoundedRectangle(cornerRadius: 16).fill(Color(.secondarySystemBackground)))
    }
}

private extension Date {
    var isToday: Bool {
        Calendar.current.isDateInToday(self)
    }
}
