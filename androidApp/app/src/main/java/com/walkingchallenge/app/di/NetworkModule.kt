package com.walkingchallenge.app.di

import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import com.walkingchallenge.app.BuildConfig
import com.walkingchallenge.app.auth.AuthConfig
import com.walkingchallenge.app.auth.AuthRepository
import com.walkingchallenge.app.auth.AuthRepositoryImpl
import com.walkingchallenge.app.data.remote.WalkingChallengeApi
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {
    @Binds
    @Singleton
    abstract fun bindAuthRepository(impl: AuthRepositoryImpl): AuthRepository
}

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    private val json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
    }

    @Provides
    @Singleton
    fun provideAuthConfig(): AuthConfig = AuthConfig(
        webBaseUrl = BuildConfig.WEB_BASE_URL.trimEnd('/'),
        redirectUri = AuthConfig.DEFAULT_REDIRECT_URI,
        webAppHostForAssetLinks = "app.walkingchallenge.com"
    )

    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient {
        val logging = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BODY else HttpLoggingInterceptor.Level.BASIC
        }
        return OkHttpClient.Builder()
            .addInterceptor(logging)
            .build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit {
        val contentType = "application/json".toMediaType()
        return Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .addConverterFactory(json.asConverterFactory(contentType))
            .client(okHttpClient)
            .build()
    }

    @Provides
    @Singleton
    fun provideWalkingChallengeApi(retrofit: Retrofit): WalkingChallengeApi =
        retrofit.create(WalkingChallengeApi::class.java)
}
