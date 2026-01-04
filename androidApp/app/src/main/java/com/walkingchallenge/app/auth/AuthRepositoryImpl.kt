package com.walkingchallenge.app.auth

import com.walkingchallenge.app.data.remote.AuthCodeExchangeRequest
import com.walkingchallenge.app.data.remote.WalkingChallengeApi
import com.walkingchallenge.app.model.SessionPayload
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val api: WalkingChallengeApi
) : AuthRepository {
    override suspend fun exchangeAuthorizationCode(code: String, redirectUri: String): Result<SessionPayload> =
        runCatching {
            api.exchangeAuthorizationCode(
                AuthCodeExchangeRequest(
                    code = code,
                    redirectUri = redirectUri
                )
            )
        }
}
