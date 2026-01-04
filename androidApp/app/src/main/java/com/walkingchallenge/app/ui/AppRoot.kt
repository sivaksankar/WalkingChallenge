package com.walkingchallenge.app.ui

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.compose.rememberNavController
import com.walkingchallenge.app.auth.AuthViewModel
import com.walkingchallenge.app.navigation.AppNavHost
import com.walkingchallenge.app.navigation.AppRoute
import com.walkingchallenge.app.ui.theme.WalkingChallengeTheme

@Composable
fun AppRoot(
    authViewModel: AuthViewModel,
    onLaunchAuth: () -> Unit,
    onSignOut: () -> Unit
) {
    val navController = rememberNavController()
    val authState by authViewModel.state.collectAsStateWithLifecycle()

    LaunchedEffect(authState.session) {
        if (authState.session != null) {
            navController.navigate(AppRoute.Dashboard.route) {
                popUpTo(AppRoute.SignIn.route) { inclusive = true }
            }
        } else {
            navController.navigate(AppRoute.SignIn.route) {
                popUpTo(AppRoute.Splash.route) { inclusive = true }
            }
        }
    }

    LaunchedEffect(authState.requiresHealthPermission, authState.session) {
        if (authState.requiresHealthPermission && authState.session != null) {
            navController.navigate(AppRoute.HealthPermissions.route)
        }
    }

    WalkingChallengeTheme {
        Surface(modifier = Modifier.fillMaxSize()) {
            AppNavHost(
                navController = navController,
                authViewModel = authViewModel,
                onLaunchAuth = onLaunchAuth,
                onSignOut = onSignOut
            )
        }
    }
}
