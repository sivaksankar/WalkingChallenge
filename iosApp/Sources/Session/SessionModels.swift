import Foundation

struct SessionTokens: Codable {
    let accessToken: String
    let refreshToken: String
    let expiresIn: TimeInterval
}

struct UserProfile: Codable {
    let id: String
    let name: String
    let email: String?
    let image: String?
}

struct SessionPayload: Codable {
    let tokens: SessionTokens
    let profile: UserProfile
}

struct SessionSnapshot: Codable {
    let accessToken: String
    let refreshToken: String
    let expiresAt: Date
    let user: UserProfile
}
