package com.walkingchallenge.app.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.walkingchallenge.app.model.SessionPayload
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private const val SESSION_DATASTORE_NAME = "session_store"

private val Context.dataStore by preferencesDataStore(name = SESSION_DATASTORE_NAME)

@Singleton
class SessionStore @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val accessTokenKey = stringPreferencesKey("access_token")
    private val refreshTokenKey = stringPreferencesKey("refresh_token")
    private val expiresAtKey = longPreferencesKey("expires_at")
    private val userIdKey = stringPreferencesKey("user_id")
    private val userNameKey = stringPreferencesKey("user_name")
    private val userAvatarKey = stringPreferencesKey("user_avatar")

    suspend fun saveSession(session: SessionPayload) {
        context.dataStore.edit { prefs ->
            prefs[accessTokenKey] = session.tokens.accessToken
            prefs[refreshTokenKey] = session.tokens.refreshToken
            prefs[expiresAtKey] = session.tokens.expiresIn
            prefs[userIdKey] = session.profile.id
            prefs[userNameKey] = session.profile.name
            val avatar = session.profile.image
            if (avatar != null) {
                prefs[userAvatarKey] = avatar
            } else {
                prefs.remove(userAvatarKey)
            }
        }
    }

    suspend fun clearSession() {
        context.dataStore.edit { prefs -> prefs.clear() }
    }

    val sessionFlow: Flow<SessionSnapshot?> = context.dataStore.data.map { prefs ->
        val accessToken = prefs[accessTokenKey]
        val refreshToken = prefs[refreshTokenKey]
        if (accessToken == null || refreshToken == null) {
            return@map null
        }
        SessionSnapshot(
            accessToken = accessToken,
            refreshToken = refreshToken,
            expiresAt = prefs[expiresAtKey] ?: 0L,
            userId = prefs[userIdKey],
            userName = prefs[userNameKey],
            userAvatar = prefs[userAvatarKey]
        )
    }
}

data class SessionSnapshot(
    val accessToken: String,
    val refreshToken: String,
    val expiresAt: Long,
    val userId: String?,
    val userName: String?,
    val userAvatar: String?
)
