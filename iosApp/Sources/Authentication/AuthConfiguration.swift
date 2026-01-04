import Foundation

struct AuthConfiguration {
    let webBaseURL: URL
    let redirectScheme: String
    let redirectHost: String
    let redirectPath: String
    let googleClientId: String

    var redirectURL: URL {
        var components = URLComponents()
        components.scheme = redirectScheme
        components.host = redirectHost
        components.path = redirectPath
        return components.url!
    }
    
    var webRedirectURL: URL {
        // Dedicated mobile callback to avoid clashing with NextAuth's catch-all
        let urlString = webBaseURL.absoluteString + "/api/mobile/auth/callback"
        return URL(string: urlString)!
    }

    static let defaultConfig = AuthConfiguration(
        webBaseURL: URL(string: "https://nextjs-app-409798850238.us-central1.run.app")!,
        redirectScheme: "walkingchallenge",
        redirectHost: "auth",
        redirectPath: "/callback",
        googleClientId: "409798850238-oekq5bdeg2ms073apvuoidd260gmfkpd.apps.googleusercontent.com"
    )
}
