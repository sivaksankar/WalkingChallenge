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
        return webBaseURL.appending(path: "/api/mobile/auth/callback")
    }

    static let defaultConfig = AuthConfiguration(
        webBaseURL: URL(string: "https://nextjs-app-maiqzzrcja-uc.a.run.app")!,
        redirectScheme: "walkingchallenge",
        redirectHost: "auth",
        redirectPath: "/callback",
        googleClientId: "409798850238-oekq5bdeg2ms073apvuoidd260gmfkpd.apps.googleusercontent.com"
    )
}
