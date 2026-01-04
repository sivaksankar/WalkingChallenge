import Foundation
import os.log

enum AppLogger {
    private static let subsystem = "com.walkingchallenge.app"
    
    static let auth = Logger(subsystem: subsystem, category: "Authentication")
    static let health = Logger(subsystem: subsystem, category: "HealthKit")
    static let network = Logger(subsystem: subsystem, category: "Network")
    static let general = Logger(subsystem: subsystem, category: "General")
}
