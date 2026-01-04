package com.walkingchallenge.app.auth

data class AuthConfig(
    val webBaseUrl: String,
    val redirectUri: String = DEFAULT_REDIRECT_URI,
    val webAppHostForAssetLinks: String = "app.walkingchallenge.com"
) {
    companion object {
        const val DEFAULT_REDIRECT_URI = "walkingchallenge://auth/callback"
    }
}
