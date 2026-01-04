import SwiftUI

struct HealthPermissionsView: View {
    let isLoading: Bool
    let isAppleHealthAvailable: Bool
    let onConnect: () -> Void
    let onSkip: () -> Void

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Spacer()
                Text("Connect Apple Health")
                    .font(.title2.bold())
                    .multilineTextAlignment(.center)
                Text(message)
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                Button(action: onConnect) {
                    HStack {
                        Spacer()
                        if isLoading {
                            ProgressView()
                        } else {
                            Text(isAppleHealthAvailable ? "Connect" : "Retry")
                        }
                        Spacer()
                    }
                }
                .buttonStyle(.primary)
                .disabled(isLoading)
                Button("I'll do this later", role: .cancel, action: onSkip)
                    .disabled(isLoading)
                Spacer()
            }
            .padding(24)
            .navigationTitle("Apple Health")
        }
    }

    private var message: String {
        if isAppleHealthAvailable {
            return "Grant access so we can read your step data from Apple Health and keep the Walking Challenge leaderboard accurate."
        } else {
            return "Apple Health data is not available on this device. Make sure Health is installed and you're signed in, then try again."
        }
    }
}
