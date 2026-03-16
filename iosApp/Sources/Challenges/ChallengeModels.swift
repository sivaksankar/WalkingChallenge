import Foundation

struct Challenge: Identifiable, Codable {
    let id: String
    let name: String
    let description: String?
    let startDate: String?
    let endDate: String?
    let minSteps: Int?
    let participants: [String]?

    var participantCount: Int { participants?.count ?? 0 }
}

struct LeaderboardEntry: Identifiable, Codable {
    let id: String
    let name: String
    let email: String?
    let steps: Int
    let image: String?
}
