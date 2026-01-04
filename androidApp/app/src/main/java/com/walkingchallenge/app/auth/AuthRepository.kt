package com.walkingchallenge.app.auth

import com.walkingchallenge.app.model.SessionPayload

interface AuthRepository {
    suspend fun exchangeAuthorizationCode(code: String, redirectUri: String): Result<SessionPayload>
}
