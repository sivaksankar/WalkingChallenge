import AuthenticationServices
import Foundation
import UIKit

final class AuthService: NSObject {
    struct AuthResponse {
        let code: String
    }

    enum AuthError: Error, LocalizedError {
        case missingCode
        case authorizationFailed
        case cancelled
        case serverError(String)

        var errorDescription: String? {
            switch self {
            case .missingCode:
                return "Authorization code was not returned."
            case .authorizationFailed:
                return "The sign-in flow could not be completed."
            case .cancelled:
                return "You cancelled the sign-in flow."
            case .serverError(let message):
                return message
            }
        }
    }

    private let configuration: AuthConfiguration
    private let urlSession: URLSession
    private var activeSession: ASWebAuthenticationSession?

    init(configuration: AuthConfiguration, urlSession: URLSession = .shared) {
        self.configuration = configuration
        self.urlSession = urlSession
    }

    func startSignIn() async throws -> AuthResponse {
        let authURL = authorizationURL()
        return try await withCheckedThrowingContinuation { continuation in
            Task { @MainActor in
                let provider = AuthenticationPresentationProvider()
                let session = ASWebAuthenticationSession(url: authURL, callbackURLScheme: configuration.redirectScheme) { [weak self] callbackURL, error in
                    defer { self?.activeSession = nil }
                    if let nsError = error as? ASWebAuthenticationSessionError,
                       nsError.code == .canceledLogin {
                        continuation.resume(throwing: AuthError.cancelled)
                        return
                    }
                    if let error = error {
                        continuation.resume(throwing: error)
                        return
                    }
                    guard let callbackURL else {
                        continuation.resume(throwing: AuthError.authorizationFailed)
                        return
                    }
                    guard let code = Self.extractCode(from: callbackURL) else {
                        continuation.resume(throwing: AuthError.missingCode)
                        return
                    }
                    continuation.resume(returning: AuthResponse(code: code))
                }
                session.presentationContextProvider = provider
                // Use in-app browser session for better health integration
                session.prefersEphemeralWebBrowserSession = false
                self.activeSession = session
                if !session.start() {
                    self.activeSession = nil
                    continuation.resume(throwing: AuthError.authorizationFailed)
                }
            }
        }
    }

    func exchangeAuthorizationCode(_ code: String) async throws -> SessionPayload {
        let exchangeURL = configuration.webBaseURL.appending(path: "/api/mobile/auth/exchange")
        var request = URLRequest(url: exchangeURL)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        let payload = [
            "code": code,
            "redirectUri": configuration.redirectURL.absoluteString
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let (data, response) = try await urlSession.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw AuthError.serverError("Invalid server response")
        }
        guard (200..<300).contains(http.statusCode) else {
            let message = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw AuthError.serverError(message)
        }
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return try decoder.decode(SessionPayload.self, from: data)
    }

    private func authorizationURL() -> URL {
        var components = URLComponents(string: "https://accounts.google.com/o/oauth2/v2/auth")!
        components.queryItems = [
            URLQueryItem(name: "client_id", value: configuration.googleClientId),
            URLQueryItem(name: "redirect_uri", value: configuration.redirectURL.absoluteString),
            URLQueryItem(name: "response_type", value: "code"),
            URLQueryItem(name: "scope", value: "openid email profile"),
            URLQueryItem(name: "access_type", value: "offline"),
            URLQueryItem(name: "prompt", value: "consent")
        ]
        return components.url!
    }

    private static func extractCode(from callbackURL: URL) -> String? {
        URLComponents(url: callbackURL, resolvingAgainstBaseURL: false)?
            .queryItems?
            .first { $0.name == "code" }?
            .value
    }
}

private final class AuthenticationPresentationProvider: NSObject, ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first(where: { $0.isKeyWindow }) ?? ASPresentationAnchor()
    }
}
