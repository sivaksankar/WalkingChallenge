package com.walkingchallenge.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.core.view.WindowCompat
import androidx.lifecycle.lifecycleScope
import com.walkingchallenge.app.auth.AuthViewModel
import com.walkingchallenge.app.auth.AuthViewModelEvent
import com.walkingchallenge.app.ui.AppRoot
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    private val authViewModel: AuthViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)

        authViewModel.events
            .onEach { event -> handleAuthEvent(event) }
            .launchIn(lifecycleScope)

        intent?.let(::handleIntentIfNeeded)

        setContent {
            AppRoot(
                authViewModel = authViewModel,
                onLaunchAuth = { authViewModel.startBrowserAuth(this) },
                onSignOut = { authViewModel.onSignOutRequested(this) }
            )
        }
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        intent?.let(::handleIntentIfNeeded)
    }

    private fun handleIntentIfNeeded(intent: Intent) {
        val uri = intent.data ?: return
        if (uri.scheme?.equals(AuthViewModel.REDIRECT_SCHEME, ignoreCase = true) == true) {
            authViewModel.onAuthCallback(uri)
        }
    }

    private fun handleAuthEvent(event: AuthViewModelEvent) {
        when (event) {
            AuthViewModelEvent.Completed -> Unit
            is AuthViewModelEvent.Error -> {
                // Surface the error with a simple Snackbar once we have Scaffold in place.
            }
        }
    }
}
