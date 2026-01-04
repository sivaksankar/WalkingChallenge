import Foundation

struct AuthConfiguration {
    let webBaseURL: URL
    let redirectScheme: String
    let redirectHost: String
    let redirectPath: String

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
        redirectPath: "/callback"
    )
}
