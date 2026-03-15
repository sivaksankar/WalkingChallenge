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
            session.prefersEphemeralWebBrowserSession = true
            self.activeSession = session
            if !session.start() {
                self.activeSession = nil
                continuation.resume(throwing: AuthError.authorizationFailed)
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
        let rawJSON = String(data: data, encoding: .utf8) ?? "(binary)"
        print("[AuthService] Exchange response status: \(http.statusCode)")
        print("[AuthService] Exchange response body: \(rawJSON)")
        guard (200..<300).contains(http.statusCode) else {
            throw AuthError.serverError(rawJSON)
        }
        return try Self.parseSessionPayload(from: data)
    }

    private func authorizationURL() -> URL {
        var components = URLComponents(url: configuration.webBaseURL, resolvingAgainstBaseURL: false)!
        // Use custom mobile OAuth endpoint that redirects directly to Google
        // with our custom redirect_uri for ASWebAuthenticationSession
        components.path = "/api/mobile/auth/google"
        components.queryItems = [
            URLQueryItem(name: "redirect_uri", value: configuration.redirectURL.absoluteString)
        ]
        return components.url!
    }

    // Manual parsing using JSONSerialization to avoid NSException from type mismatches.
    // JSONDecoder uses JSONSerialization internally and can throw an ObjC exception
    // (not a Swift error) if it encounters a number where it expects a string.
    private static func parseSessionPayload(from data: Data) throws -> SessionPayload {
        guard let root = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw AuthError.serverError("Invalid JSON response")
        }
        guard let tokensDict = root["tokens"] as? [String: Any] else {
            throw AuthError.serverError("Missing tokens in response")
        }
        guard let profileDict = root["profile"] as? [String: Any] else {
            throw AuthError.serverError("Missing profile in response")
        }

        // Coerce token fields — convert any number to string defensively
        func str(_ dict: [String: Any], _ key: String) -> String? {
            if let s = dict[key] as? String { return s }
            if let n = dict[key] as? NSNumber { return n.stringValue }
            return nil
        }
        guard let accessToken = str(tokensDict, "access_token") else {
            throw AuthError.serverError("Missing access_token")
        }
        let refreshToken = str(tokensDict, "refresh_token") ?? ""
        let expiresIn: TimeInterval
        if let n = tokensDict["expires_in"] as? NSNumber {
            expiresIn = n.doubleValue
        } else if let s = tokensDict["expires_in"] as? String, let d = Double(s) {
            expiresIn = d
        } else {
            expiresIn = 3600
        }

        guard let id = str(profileDict, "id") else {
            throw AuthError.serverError("Missing profile id")
        }
        let name = str(profileDict, "name") ?? "User"
        let email = str(profileDict, "email")
        let image = str(profileDict, "image")

        let tokens = SessionTokens(accessToken: accessToken, refreshToken: refreshToken, expiresIn: expiresIn)
        let profile = UserProfile(id: id, name: name, email: email, image: image)
        return SessionPayload(tokens: tokens, profile: profile)
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
