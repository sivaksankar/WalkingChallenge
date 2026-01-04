import AuthenticationServices
import Foundation
import UIKit

final class AuthService: NSObject {
    struct AuthResponse {
        let code: String?
        let payload: SessionPayload?
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

    init(configuration: AuthConfiguration, urlSession: URLSession? = nil) {
        self.configuration = configuration
        if let urlSession {
            self.urlSession = urlSession
        } else {
            let sessionConfig = URLSessionConfiguration.default
            sessionConfig.timeoutIntervalForRequest = 30
            sessionConfig.timeoutIntervalForResource = 60
            sessionConfig.requestCachePolicy = .reloadIgnoringLocalCacheData
            self.urlSession = URLSession(configuration: sessionConfig)
        }
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
                        print("❌ ASWebAuthenticationSession error: \(error.localizedDescription)")
                        continuation.resume(throwing: error)
                        return
                    }
                    guard let callbackURL else {
                        print("❌ No callback URL received")
                        continuation.resume(throwing: AuthError.authorizationFailed)
                        return
                    }
                    print("✅ Received callback URL: \(callbackURL.absoluteString)")
                    print("   Scheme: \(callbackURL.scheme ?? "none")")
                    print("   Host: \(callbackURL.host ?? "none")")
                    print("   Path: \(callbackURL.path)")
                    print("   Query: \(callbackURL.query ?? "none")")
                    
                    if let payload = Self.extractSessionPayload(from: callbackURL) {
                        print("✅ Received inline session payload")
                        continuation.resume(returning: AuthResponse(code: nil, payload: payload))
                        return
                    }
                    guard let code = Self.queryValue(named: "code", from: callbackURL) else {
                        print("❌ Failed to extract code from callback URL")
                        continuation.resume(throwing: AuthError.missingCode)
                        return
                    }
                    print("✅ Extracted authorization code: \(code.prefix(10))...")
                    continuation.resume(returning: AuthResponse(code: code, payload: nil))
                }
                session.presentationContextProvider = provider
                // Use in-app browser - false keeps cookies, but still opens Safari
                // iOS will always use Safari for OAuth, but this ensures it comes back to app
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
        let exchangeURL = configuration.webBaseURL.absoluteString + "/api/mobile/auth/exchange"
        print("🔄 Exchange URL: \(exchangeURL)")
        
        guard let url = URL(string: exchangeURL) else {
            throw AuthError.serverError("Invalid exchange URL")
        }
        
        let redirectUriString = configuration.webRedirectURL.absoluteString
        print("🔄 Redirect URI: \(redirectUriString)")
        print("🔄 Code: \(code.prefix(10))...")
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json; charset=utf-8", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.cachePolicy = .reloadIgnoringLocalCacheData
        request.timeoutInterval = 30
        print("🔍 Request headers:", request.allHTTPHeaderFields ?? [:])
        
        let payload: [String: Any] = [
            "code": code,
            "redirectUri": redirectUriString
        ]
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: payload)
        } catch {
            throw AuthError.serverError("Failed to encode request: \(error.localizedDescription)")
        }
        
        print("✅ Request body created successfully")
        print("🌐 Sending request...")
        
        let (data, response) = try await urlSession.data(for: request)
        print("✅ Received response")
        
        if let responseString = String(data: data, encoding: .utf8) {
            print("📥 Exchange response: \(responseString)")
        }
        
        guard let http = response as? HTTPURLResponse else {
            throw AuthError.serverError("Invalid server response")
        }
        print("📊 Response status: \(http.statusCode)")
        
        guard (200..<300).contains(http.statusCode) else {
            let message = String(data: data, encoding: .utf8) ?? "Unknown error"
            print("❌ Exchange failed with status \(http.statusCode): \(message)")
            throw AuthError.serverError(message)
        }
        
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        
        do {
            let payload = try decoder.decode(SessionPayload.self, from: data)
            print("✅ Successfully decoded session payload")
            return payload
        } catch {
            print("❌ JSON decode error: \(error)")
            if let decodingError = error as? DecodingError {
                print("   Decoding error details: \(decodingError)")
            }
            throw AuthError.serverError("Failed to decode response: \(error.localizedDescription)")
        }
    }

    private func authorizationURL() -> URL {
        var components = URLComponents(string: "https://accounts.google.com/o/oauth2/v2/auth")!
        components.queryItems = [
            URLQueryItem(name: "client_id", value: configuration.googleClientId),
            URLQueryItem(name: "redirect_uri", value: configuration.webRedirectURL.absoluteString),
            URLQueryItem(name: "response_type", value: "code"),
            URLQueryItem(name: "scope", value: "openid email profile"),
            URLQueryItem(name: "access_type", value: "offline"),
            URLQueryItem(name: "prompt", value: "consent")
        ]
        return components.url!
    }

    private static func queryValue(named name: String, from callbackURL: URL) -> String? {
        URLComponents(url: callbackURL, resolvingAgainstBaseURL: false)?
            .queryItems?
            .first { $0.name == name }?
            .value
    }

    private static func extractSessionPayload(from callbackURL: URL) -> SessionPayload? {
        guard let payloadString = queryValue(named: "payload", from: callbackURL) else {
            return nil
        }
        var normalized = payloadString
            .replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")
        let padding = 4 - (normalized.count % 4)
        if padding < 4 {
            normalized.append(String(repeating: "=", count: padding))
        }
        guard let data = Data(base64Encoded: normalized) else {
            print("❌ Failed to decode payload base64 string")
            return nil
        }
        do {
            let decoder = JSONDecoder()
            decoder.keyDecodingStrategy = .convertFromSnakeCase
            return try decoder.decode(SessionPayload.self, from: data)
        } catch {
            print("❌ Failed to decode session payload JSON: \(error)")
            return nil
        }
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
