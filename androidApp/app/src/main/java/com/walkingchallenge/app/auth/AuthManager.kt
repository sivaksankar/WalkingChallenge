package com.walkingchallenge.app.auth

import android.content.Context
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthManager @Inject constructor(
    private val config: AuthConfig
) {
    fun launchSignIn(triggerContext: Context) {
        val uri = buildSignInUri()
        CustomTabsIntent.Builder()
            .setShowTitle(true)
            .build()
            .launchUrl(triggerContext, uri)
    }

    fun buildSignInUri(): Uri {
        return Uri.parse(config.webBaseUrl)
            .buildUpon()
            .appendEncodedPath("api/auth/signin")
            .appendQueryParameter("redirect_uri", config.redirectUri)
            .build()
    }

    fun parseAuthResponse(uri: Uri): AuthResponse {
        val error = uri.getQueryParameter("error")
        val code = uri.getQueryParameter("code")
        return AuthResponse(
            authorizationCode = code,
            error = error
        )
    }

    fun launchSignOut(triggerContext: Context) {
        val uri = Uri.parse(config.webBaseUrl)
            .buildUpon()
            .appendEncodedPath("api/auth/signout")
            .appendQueryParameter("redirect_uri", config.redirectUri)
            .build()
        CustomTabsIntent.Builder()
            .setShowTitle(true)
            .build()
            .launchUrl(triggerContext, uri)
    }

    data class AuthResponse(
        val authorizationCode: String?,
        val error: String?
    )
}
