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
    let imageURL: String?
    
    enum CodingKeys: String, CodingKey {
        case id, name, email
        case imageURL = "image"
    }
    
    var image: URL? {
        guard let imageURL else { return nil }
        return URL(string: imageURL)
    }
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
