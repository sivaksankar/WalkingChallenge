package com.walkingchallenge.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Handle intent if app was started with a deep link
        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);

        // Handle deep link when app is already running
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        if (intent == null) return;

        String action = intent.getAction();
        Uri data = intent.getData();

        Log.d(TAG, "handleIntent - Action: " + action + ", Data: " + data);

        if (Intent.ACTION_VIEW.equals(action) && data != null) {
            String scheme = data.getScheme();
            String host = data.getHost();
            String path = data.getPath();

            Log.d(TAG, "Deep link - Scheme: " + scheme + ", Host: " + host + ", Path: " + path);

            // Handle custom scheme (walkingchallenge://)
            if ("walkingchallenge".equals(scheme)) {
                String webPath = "/dashboard"; // Default

                if ("dashboard".equals(host) || "/dashboard".equals(path)) {
                    webPath = "/dashboard";
                } else if ("login".equals(host) || "/login".equals(path)) {
                    webPath = "/login";
                } else if ("challenges".equals(host) || "/challenges".equals(path)) {
                    webPath = "/dashboard/challenges";
                } else if ("profile".equals(host) || "/profile".equals(path)) {
                    webPath = "/dashboard/profile";
                }

                Log.d(TAG, "Navigating WebView to: " + webPath);
                navigateWebView(webPath);
            }
            // Handle App Links (https://)
            else if ("https".equals(scheme) &&
                     "nextjs-app-409798850238.us-central1.run.app".equals(host)) {
                // The WebView will load the URL directly via Capacitor's handling
                // But we can also manually navigate if needed
                if (path != null && !path.isEmpty()) {
                    Log.d(TAG, "App Link - navigating to: " + path);
                    navigateWebView(path);
                }
            }
        }
    }

    private void navigateWebView(String path) {
        // Use JavaScript to navigate the WebView
        if (getBridge() != null && getBridge().getWebView() != null) {
            final String jsCode = "window.location.href = '" + path + "';";

            runOnUiThread(() -> {
                getBridge().getWebView().evaluateJavascript(jsCode, value -> {
                    Log.d(TAG, "Navigation result: " + value);
                });
            });
        } else {
            Log.w(TAG, "Bridge or WebView not ready for navigation");
        }
    }
}
