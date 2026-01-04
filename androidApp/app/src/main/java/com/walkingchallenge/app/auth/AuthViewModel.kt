package com.walkingchallenge.app.auth

import android.content.Context
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.walkingchallenge.app.data.SessionSnapshot
import com.walkingchallenge.app.data.SessionStore
import com.walkingchallenge.app.model.SessionPayload
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val authManager: AuthManager,
    private val sessionStore: SessionStore,
    private val authConfig: AuthConfig
) : ViewModel() {

    private val _state = MutableStateFlow(AuthViewModelState())
    val state: StateFlow<AuthViewModelState> = _state.asStateFlow()

    private val _events = MutableSharedFlow<AuthViewModelEvent>(extraBufferCapacity = 1, onBufferOverflow = BufferOverflow.DROP_OLDEST)
    val events: SharedFlow<AuthViewModelEvent> = _events.asSharedFlow()

    init {
        viewModelScope.launch {
            sessionStore.sessionFlow.collect { snapshot ->
                _state.update { current ->
                    current.copy(session = snapshot)
                }
            }
        }
    }

    fun startBrowserAuth(context: Context) {
        _state.update { it.copy(isLoading = true, errorMessage = null) }
        authManager.launchSignIn(context)
    }

    fun onAuthCallback(uri: Uri) {
        val response = authManager.parseAuthResponse(uri)
        if (response.error != null) {
            _state.update { it.copy(isLoading = false, errorMessage = response.error) }
            emitError(response.error)
            return
        }
        val code = response.authorizationCode
        if (code.isNullOrBlank()) {
            _state.update { it.copy(isLoading = false, errorMessage = "Authorization code missing") }
            emitError("Authorization code missing")
            return
        }
        exchangeAuthorizationCode(code)
    }

    fun clearError() {
        _state.update { it.copy(errorMessage = null) }
    }

    fun markHealthPermissionHandled() {
        _state.update { it.copy(requiresHealthPermission = false) }
    }

    fun onSignOutRequested(context: Context) {
        viewModelScope.launch {
            sessionStore.clearSession()
            _state.update { it.copy(session = null) }
        }
        authManager.launchSignOut(context)
    }

    private fun exchangeAuthorizationCode(code: String) {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, errorMessage = null) }
            val result = authRepository.exchangeAuthorizationCode(code, authConfig.redirectUri)
            result.fold(
                onSuccess = { payload ->
                    persistSession(payload)
                },
                onFailure = { throwable ->
                    val message = throwable.message ?: "Sign-in failed"
                    _state.update { it.copy(isLoading = false, errorMessage = message) }
                    emitError(message)
                }
            )
        }
    }

    private fun persistSession(payload: SessionPayload) {
        viewModelScope.launch {
            sessionStore.saveSession(payload)
            _state.update {
                it.copy(
                    isLoading = false,
                    session = SessionSnapshot(
                        accessToken = payload.tokens.accessToken,
                        refreshToken = payload.tokens.refreshToken,
                        expiresAt = payload.tokens.expiresIn,
                        userId = payload.profile.id,
                        userName = payload.profile.name,
                        userAvatar = payload.profile.image
                    ),
                    requiresHealthPermission = true
                )
            }
            _events.emit(AuthViewModelEvent.Completed)
        }
    }

    private fun emitError(message: String) {
        viewModelScope.launch {
            _events.emit(AuthViewModelEvent.Error(message))
        }
    }

    companion object {
        val REDIRECT_SCHEME: String = Uri.parse(AuthConfig.DEFAULT_REDIRECT_URI).scheme ?: "walkingchallenge"
    }
}

data class AuthViewModelState(
    val session: SessionSnapshot? = null,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val requiresHealthPermission: Boolean = false
)

sealed interface AuthViewModelEvent {
    data object Completed : AuthViewModelEvent
    data class Error(val message: String) : AuthViewModelEvent
}
