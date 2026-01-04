package com.walkingchallenge.app.data.remote

import com.walkingchallenge.app.model.SessionPayload
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import retrofit2.http.Body
import retrofit2.http.POST

interface WalkingChallengeApi {
    @POST("api/mobile/auth/exchange")
    suspend fun exchangeAuthorizationCode(
        @Body body: AuthCodeExchangeRequest
    ): SessionPayload
}

@Serializable
data class AuthCodeExchangeRequest(
    @SerialName("code") val code: String,
    @SerialName("redirectUri") val redirectUri: String
)
