package com.walkingchallenge.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.walkingchallenge.app.ui.components.PrimaryButton

@Composable
fun HealthPermissionsScreen(
    isLoading: Boolean,
    isSamsungHealthAvailable: Boolean,
    errorMessage: String?,
    onRequestPermissions: () -> Unit,
    onSkip: () -> Unit,
    onErrorConsumed: () -> Unit
) {
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(errorMessage) {
        val message = errorMessage
        if (!message.isNullOrBlank()) {
            snackbarHostState.showSnackbar(message)
            onErrorConsumed()
        }
    }

    Scaffold(snackbarHost = { SnackbarHost(snackbarHostState) }) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "Connect Samsung Health",
                style = MaterialTheme.typography.headlineSmall,
                textAlign = TextAlign.Center
            )
            Text(
                text = if (isSamsungHealthAvailable) {
                    "Allow Walking Challenge to access your step data so we can keep the leaderboard up to date."
                } else {
                    "Samsung Health is not available on this device. You can continue, but step sync will be limited."
                },
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = 12.dp)
            )
            Spacer(modifier = Modifier.height(24.dp))
            PrimaryButton(
                text = if (isSamsungHealthAvailable) "Connect Samsung Health" else "Retry",
                modifier = Modifier.fillMaxWidth(),
                enabled = !isLoading,
                onClick = onRequestPermissions
            )
            OutlinedButton(
                onClick = onSkip,
                modifier = Modifier
                    .padding(top = 12.dp)
                    .fillMaxWidth(),
                enabled = !isLoading
            ) {
                Text("I'll do this later")
            }
            if (isLoading) {
                CircularProgressIndicator(modifier = Modifier.padding(top = 24.dp))
            }
        }
    }
}
