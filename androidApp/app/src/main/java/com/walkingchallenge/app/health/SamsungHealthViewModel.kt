package com.walkingchallenge.app.health

import android.app.Activity
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

@HiltViewModel
class SamsungHealthViewModel @Inject constructor(
    private val samsungHealthManager: SamsungHealthManager
) : ViewModel() {

    private val _isRequesting = MutableStateFlow(false)
    val isRequesting: StateFlow<Boolean> = _isRequesting.asStateFlow()

    private val _events = MutableSharedFlow<HealthPermissionEvent>(extraBufferCapacity = 1, onBufferOverflow = BufferOverflow.DROP_OLDEST)
    val events: SharedFlow<HealthPermissionEvent> = _events.asSharedFlow()

    val isSamsungHealthAvailable: Boolean
        get() = samsungHealthManager.isAvailable

    fun requestPermissions(activity: Activity) {
        if (_isRequesting.value) return
        viewModelScope.launch {
            _isRequesting.value = true
            val result = samsungHealthManager.requestAuthorization(activity)
            _isRequesting.value = false
            result.fold(
                onSuccess = {
                    _events.emit(HealthPermissionEvent.Granted)
                },
                onFailure = { throwable ->
                    _events.emit(HealthPermissionEvent.Error(throwable.message ?: "Samsung Health authorization failed"))
                }
            )
        }
    }
}

sealed interface HealthPermissionEvent {
    data object Granted : HealthPermissionEvent
    data class Error(val message: String) : HealthPermissionEvent
}
