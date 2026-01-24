import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused while the application was inactive.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Handle custom URL scheme (walkingchallenge://)
        print("[AppDelegate] URL opened: \(url.absoluteString)")

        // Check if this is our custom scheme
        if url.scheme == "walkingchallenge" {
            // Handle the deep link by navigating the WebView
            handleDeepLink(url: url)
            return true
        }

        // Let Capacitor handle other URLs
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        print("[AppDelegate] Universal Link activity: \(userActivity.webpageURL?.absoluteString ?? "none")")
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    // Handle deep links from custom URL scheme
    private func handleDeepLink(url: URL) {
        print("[AppDelegate] Handling deep link: \(url.absoluteString)")

        // Get the path from the URL (e.g., "dashboard" from "walkingchallenge://dashboard")
        let path = url.host ?? url.path
        print("[AppDelegate] Deep link path: \(path)")

        // Map the deep link path to a web URL path
        var webPath = "/dashboard" // Default to dashboard

        if path == "dashboard" || path == "/dashboard" {
            webPath = "/dashboard"
        } else if path == "login" || path == "/login" {
            webPath = "/login"
        } else if path == "challenges" || path == "/challenges" {
            webPath = "/dashboard/challenges"
        } else if path == "profile" || path == "/profile" {
            webPath = "/dashboard/profile"
        }

        // Navigate the WebView to the path
        // We use NotificationCenter to communicate with the WebView
        DispatchQueue.main.async {
            NotificationCenter.default.post(
                name: NSNotification.Name("DeepLinkNavigation"),
                object: nil,
                userInfo: ["path": webPath]
            )

            // Also try to navigate using JavaScript if the bridge is ready
            if let rootVC = self.window?.rootViewController as? CAPBridgeViewController {
                let serverUrl = "https://nextjs-app-409798850238.us-central1.run.app"
                let fullUrl = "\(serverUrl)\(webPath)"
                print("[AppDelegate] Navigating WebView to: \(fullUrl)")

                // Execute JavaScript to navigate
                rootVC.bridge?.webView?.evaluateJavaScript(
                    "window.location.href = '\(webPath)';"
                ) { result, error in
                    if let error = error {
                        print("[AppDelegate] JS navigation error: \(error)")
                    } else {
                        print("[AppDelegate] JS navigation successful")
                    }
                }
            }
        }
    }
}
