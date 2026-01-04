package com.walkingchallenge.app.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class SessionTokens(
    @SerialName("accessToken") val accessToken: String,
    @SerialName("refreshToken") val refreshToken: String,
    @SerialName("expiresIn") val expiresIn: Long
)

@Serializable
data class UserProfile(
    val id: String,
    val name: String,
    val image: String? = null,
    val email: String? = null
)

@Serializable
data class SessionPayload(
    val tokens: SessionTokens,
    val profile: UserProfile
)
