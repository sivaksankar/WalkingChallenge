import Foundation

final class SessionStore {
    private enum Keys {
        static let sessionData = "com.walkingchallenge.session.data"
    }

    private let defaults: UserDefaults
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        encoder.dateEncodingStrategy = .secondsSince1970
        decoder.dateDecodingStrategy = .secondsSince1970
    }

    var currentSession: SessionSnapshot? {
        guard let data = defaults.data(forKey: Keys.sessionData) else { return nil }
        return try? decoder.decode(SessionSnapshot.self, from: data)
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
