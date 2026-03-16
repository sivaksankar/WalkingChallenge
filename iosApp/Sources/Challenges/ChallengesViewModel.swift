import Foundation

@MainActor
final class ChallengesViewModel: ObservableObject {
    @Published var allChallenges: [Challenge] = []
    @Published var myChallenges: [Challenge] = []
    @Published var leaderboard: [LeaderboardEntry] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let baseURL = URL(string: "https://nextjs-app-409798850238.us-central1.run.app")!

    func load(session: SessionSnapshot) async {
        isLoading = true
        errorMessage = nil
        async let all = fetchAllChallenges()
        async let mine = fetchMyChallenges(userId: session.user.id)
        async let board = fetchLeaderboard()
        allChallenges = await all
        myChallenges = await mine
        leaderboard = await board
        isLoading = false
    }

    func join(challengeId: String, session: SessionSnapshot) async {
        do {
            var req = URLRequest(url: baseURL.appending(path: "/api/mobile/challenges/join"))
            req.httpMethod = "POST"
            req.addValue("application/json", forHTTPHeaderField: "Content-Type")
            req.addValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
            req.httpBody = try JSONSerialization.data(withJSONObject: ["challengeId": challengeId])
            let (data, _) = try await URLSession.shared.data(for: req)
            let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
            if json?["success"] as? Bool == true {
                await load(session: session)
            } else {
                errorMessage = json?["error"] as? String ?? "Failed to join"
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func fetchAllChallenges() async -> [Challenge] {
        guard let url = URL(string: "\(baseURL)/api/challenges") else { return [] }
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
            let raw = json?["challenges"] as? [[String: Any]] ?? []
            return raw.compactMap { parseChallenge($0) }
        } catch { return [] }
    }

    private func fetchMyChallenges(userId: String) async -> [Challenge] {
        guard !userId.isEmpty, userId != "undefined",
              let url = URL(string: "\(baseURL)/api/users/challenges?userId=\(userId)") else { return [] }
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
            let raw = json?["challenges"] as? [[String: Any]] ?? []
            return raw.compactMap { parseChallenge($0) }
        } catch { return [] }
    }

    private func fetchLeaderboard() async -> [LeaderboardEntry] {
        guard let url = URL(string: "\(baseURL)/api/leaderboard?limit=20") else { return [] }
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
            let raw = json?["leaderboard"] as? [[String: Any]] ?? []
            return raw.enumerated().compactMap { _, d -> LeaderboardEntry? in
                guard let id = d["id"] as? String, let name = d["name"] as? String else { return nil }
                return LeaderboardEntry(
                    id: id,
                    name: name,
                    email: d["email"] as? String,
                    steps: d["steps"] as? Int ?? 0,
                    image: d["image"] as? String
                )
            }
        } catch { return [] }
    }

    private func parseChallenge(_ d: [String: Any]) -> Challenge? {
        guard let id = d["id"] as? String, let name = d["name"] as? String else { return nil }
        return Challenge(
            id: id,
            name: name,
            description: d["description"] as? String,
            startDate: d["startDate"] as? String,
            endDate: d["endDate"] as? String,
            minSteps: d["minSteps"] as? Int,
            participants: d["participants"] as? [String]
        )
    }
}
