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

    static let defaultConfig = AuthConfiguration(
        webBaseURL: URL(string: "https://nextjs-app-maiqzzrcja-uc.a.run.app")!,
        redirectScheme: "walkingchallenge",
        redirectHost: "auth",
        redirectPath: "/callback",
        googleClientId: "460193411242-n6aqbl6o4cu53o7u1f76fp6pam4uj5f8.apps.googleusercontent.com"
    )
}
