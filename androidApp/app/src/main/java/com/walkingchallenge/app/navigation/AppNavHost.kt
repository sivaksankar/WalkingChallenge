package com.walkingchallenge.app.navigation

import android.app.Activity
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.walkingchallenge.app.auth.AuthViewModel
import com.walkingchallenge.app.health.HealthPermissionEvent
import com.walkingchallenge.app.health.SamsungHealthViewModel
import com.walkingchallenge.app.ui.screens.DashboardScreen
import com.walkingchallenge.app.ui.screens.HealthPermissionsScreen
import com.walkingchallenge.app.ui.screens.SignInScreen
import com.walkingchallenge.app.ui.screens.SplashScreen
import androidx.compose.ui.platform.LocalContext
import kotlinx.coroutines.flow.collect

sealed class AppRoute(val route: String) {
    data object Splash : AppRoute("splash")
    data object SignIn : AppRoute("sign_in")
    data object Dashboard : AppRoute("dashboard")
    data object HealthPermissions : AppRoute("health_permissions")
}

@Composable
fun AppNavHost(
    navController: NavHostController,
    authViewModel: AuthViewModel,
    onLaunchAuth: () -> Unit,
    onSignOut: () -> Unit
) {
    NavHost(
        navController = navController,
        startDestination = AppRoute.Splash.route
    ) {
        composable(AppRoute.Splash.route) {
            SplashScreen()
        }
        composable(AppRoute.SignIn.route) {
            val state by authViewModel.state.collectAsStateWithLifecycle()
            SignInScreen(
                isLoading = state.isLoading,
                errorMessage = state.errorMessage,
                onSignInClick = onLaunchAuth,
                onErrorConsumed = authViewModel::clearError
            )
        }
        composable(AppRoute.Dashboard.route) {
            val state by authViewModel.state.collectAsStateWithLifecycle()
            DashboardScreen(
                session = state.session,
                onSignOut = onSignOut
            )
        }
        composable(AppRoute.HealthPermissions.route) {
            val healthViewModel: SamsungHealthViewModel = hiltViewModel()
            val isLoading by healthViewModel.isRequesting.collectAsStateWithLifecycle()
            val context = LocalContext.current
            var errorMessage by remember { mutableStateOf<String?>(null) }

            LaunchedEffect(Unit) {
                healthViewModel.events.collect { event ->
                    when (event) {
                        HealthPermissionEvent.Granted -> {
                            authViewModel.markHealthPermissionHandled()
                            navController.navigate(AppRoute.Dashboard.route) {
                                popUpTo(AppRoute.Dashboard.route) { inclusive = true }
                                launchSingleTop = true
                            }
                        }

                        is HealthPermissionEvent.Error -> {
                            errorMessage = event.message
                        }
                    }
                }
            }

            HealthPermissionsScreen(
                isLoading = isLoading,
                isSamsungHealthAvailable = healthViewModel.isSamsungHealthAvailable,
                errorMessage = errorMessage,
                onRequestPermissions = {
                    val activity = context as? Activity
                    if (activity != null) {
                        healthViewModel.requestPermissions(activity)
                    } else {
                        errorMessage = "Unable to launch Samsung Health from current context"
                    }
                },
                onSkip = {
                    authViewModel.markHealthPermissionHandled()
                    navController.navigate(AppRoute.Dashboard.route) {
                        popUpTo(AppRoute.Dashboard.route) { inclusive = true }
                        launchSingleTop = true
                    }
                },
                onErrorConsumed = { errorMessage = null }
            )
        }
    }
}
