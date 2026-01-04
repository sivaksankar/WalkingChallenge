import SwiftUI

struct DebugView: View {
    @State private var logs: [String] = []
    
    var body: some View {
        NavigationView {
            List {
                Section("Configuration") {
                    LabeledContent("Base URL", value: AuthConfiguration.defaultConfig.webBaseURL.absoluteString)
                    LabeledContent("Redirect Scheme", value: AuthConfiguration.defaultConfig.redirectScheme)
                    LabeledContent("Bundle ID", value: Bundle.main.bundleIdentifier ?? "Unknown")
                    LabeledContent("Version", value: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "Unknown")
                    LabeledContent("Build", value: Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "Unknown")
                }
                
                Section("Network Test") {
                    Button("Test Backend Connection") {
                        testBackendConnection()
                    }
                }
                
                if !logs.isEmpty {
                    Section("Logs") {
                        ForEach(logs, id: \.self) { log in
                            Text(log)
                                .font(.system(.caption, design: .monospaced))
                        }
                    }
                }
            }
            .navigationTitle("Debug Info")
        }
    }
    
    private func testBackendConnection() {
        logs.removeAll()
        logs.append("Testing connection...")
        
        Task {
            do {
                let url = AuthConfiguration.defaultConfig.webBaseURL
                    .appendingPathComponent("api")
                    .appendingPathComponent("test")
                
                await MainActor.run {
                    logs.append("Connecting to: \(url.absoluteString)")
                }
                
                let (data, response) = try await URLSession.shared.data(from: url)
                
                if let httpResponse = response as? HTTPURLResponse {
                    await MainActor.run {
                        logs.append("Status: \(httpResponse.statusCode)")
                    }
                }
                
                if let responseText = String(data: data, encoding: .utf8) {
                    await MainActor.run {
                        logs.append("Response: \(responseText)")
                    }
                }
                
                await MainActor.run {
                    logs.append("✅ Connection successful")
                }
            } catch {
                await MainActor.run {
                    logs.append("❌ Error: \(error.localizedDescription)")
                }
            }
        }
    }
}
