package com.walkingchallenge.app.health

import android.app.Activity
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Placeholder for Samsung Health integration. Once the Samsung Health SDK is
 * added as a dependency, wire up real authorization and data sync here.
 */
@Singleton
class SamsungHealthManager @Inject constructor() {

    val isAvailable: Boolean
        get() = false

    suspend fun requestAuthorization(activity: Activity): Result<Unit> =
        Result.failure(IllegalStateException("Samsung Health SDK not yet integrated"))

    suspend fun syncLatestSteps(accessToken: String): Result<Unit> =
        Result.failure(IllegalStateException("Samsung Health SDK not yet integrated"))
}
