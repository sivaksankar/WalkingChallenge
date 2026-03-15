import Foundation

final class SessionStore {
    private enum Keys {
        static let sessionData = "com.walkingchallenge.session.data"
    }

    private let defaults: UserDefaults
    private let encoder = JSONEncoder()

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        encoder.dateEncodingStrategy = .secondsSince1970
    }

    var currentSession: SessionSnapshot? {
        guard let data = defaults.data(forKey: Keys.sessionData) else { return nil }
        // Use JSONSerialization instead of JSONDecoder to avoid ObjC NSException
        // when a stored value's type doesn't match (JSONDecoder throws NSException,
        // not a Swift error, so try? won't save us).
        guard let obj = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else {
            defaults.removeObject(forKey: Keys.sessionData)
            return nil
        }
        func str(_ d: [String: Any], _ k: String) -> String? {
            if let s = d[k] as? String { return s }
            if let n = d[k] as? NSNumber { return n.stringValue }
            return nil
        }
        guard let accessToken = str(obj, "accessToken"),
              let refreshToken = str(obj, "refreshToken"),
              let expiresAtNumber = obj["expiresAt"] as? NSNumber,
              let userDict = obj["user"] as? [String: Any],
              let userId = str(userDict, "id") else {
            defaults.removeObject(forKey: Keys.sessionData)
            return nil
        }
        let user = UserProfile(
            id: userId,
            name: str(userDict, "name") ?? "User",
            email: str(userDict, "email"),
            image: str(userDict, "image")
        )
        return SessionSnapshot(
            accessToken: accessToken,
            refreshToken: refreshToken,
            expiresAt: Date(timeIntervalSince1970: expiresAtNumber.doubleValue),
            user: user
        )
    }

    func store(_ snapshot: SessionSnapshot) {
        if let data = try? encoder.encode(snapshot) {
            defaults.set(data, forKey: Keys.sessionData)
        }
    }

    func clear() {
        defaults.removeObject(forKey: Keys.sessionData)
    }
}
