import SwiftUI

struct SignInView: View {
    let isLoading: Bool
    let onSignIn: () -> Void

    init(isLoading: Bool, onSignIn: @escaping () -> Void) {
        self.isLoading = isLoading
        self.onSignIn = onSignIn
    }

    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            Text("Walk More, Live Better")
                .font(.system(size: 32, weight: .bold))
                .multilineTextAlignment(.center)
            Text("Sign in to connect Apple Health and stay on top of your Walking Challenge goals wherever you go.")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            Button(action: onSignIn) {
                HStack {
                    Spacer()
                    if isLoading {
                        ProgressView()
                    } else {
                        Text("Continue with Walking Challenge")
                    }
                    Spacer()
                }
            }
            .buttonStyle(.primary)
            .disabled(isLoading)
            Spacer()
            Text("By continuing you agree to the terms and privacy policy.")
                .font(.footnote)
                .foregroundColor(.secondary)
        }
        .padding(.horizontal, 24)
        .padding(.vertical, 32)
        .toolbar(.hidden, for: .navigationBar)
    }
}
