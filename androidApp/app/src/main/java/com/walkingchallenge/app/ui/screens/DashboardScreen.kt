package com.walkingchallenge.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.vectorResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.walkingchallenge.app.R
import com.walkingchallenge.app.data.SessionSnapshot
import com.walkingchallenge.app.ui.components.PrimaryButton

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    session: SessionSnapshot?,
    onSignOut: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Walking Challenge") },
                actions = {
                    IconButton(onClick = onSignOut) {
                        Icon(
                            imageVector = ImageVector.vectorResource(id = R.drawable.ic_logout),
                            contentDescription = "Sign out"
                        )
                    }
                },
                colors = TopAppBarDefaults.smallTopAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface
                )
            )
        }
    ) { padding ->
        DashboardContent(
            paddingValues = padding,
            session = session
        )
    }
}

@Composable
private fun DashboardContent(
    paddingValues: PaddingValues,
    session: SessionSnapshot?
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(paddingValues)
            .padding(horizontal = 24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "Hey ${session?.userName ?: "Walker"}",
            style = MaterialTheme.typography.headlineMedium,
            textAlign = TextAlign.Center
        )
        Text(
            text = "Once Samsung Health is connected we'll sync your steps automatically.",
            style = MaterialTheme.typography.bodyMedium,
            textAlign = TextAlign.Center
        )
        PrimaryButton(
            text = "View Challenges",
            modifier = Modifier.fillMaxWidth(),
            onClick = { /* TODO: Implement navigation to challenge list */ }
        )
    }
}
