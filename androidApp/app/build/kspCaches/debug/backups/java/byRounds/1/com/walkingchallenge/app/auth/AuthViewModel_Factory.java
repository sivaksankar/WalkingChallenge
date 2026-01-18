package com.walkingchallenge.app.auth;

import com.walkingchallenge.app.data.SessionStore;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

@ScopeMetadata
@QualifierMetadata
@DaggerGenerated
@Generated(
    value = "dagger.internal.codegen.ComponentProcessor",
    comments = "https://dagger.dev"
)
@SuppressWarnings({
    "unchecked",
    "rawtypes",
    "KotlinInternal",
    "KotlinInternalInJava"
})
public final class AuthViewModel_Factory implements Factory<AuthViewModel> {
  private final Provider<AuthRepository> authRepositoryProvider;

  private final Provider<AuthManager> authManagerProvider;

  private final Provider<SessionStore> sessionStoreProvider;

  private final Provider<AuthConfig> authConfigProvider;

  public AuthViewModel_Factory(Provider<AuthRepository> authRepositoryProvider,
      Provider<AuthManager> authManagerProvider, Provider<SessionStore> sessionStoreProvider,
      Provider<AuthConfig> authConfigProvider) {
    this.authRepositoryProvider = authRepositoryProvider;
    this.authManagerProvider = authManagerProvider;
    this.sessionStoreProvider = sessionStoreProvider;
    this.authConfigProvider = authConfigProvider;
  }

  @Override
  public AuthViewModel get() {
    return newInstance(authRepositoryProvider.get(), authManagerProvider.get(), sessionStoreProvider.get(), authConfigProvider.get());
  }

  public static AuthViewModel_Factory create(Provider<AuthRepository> authRepositoryProvider,
      Provider<AuthManager> authManagerProvider, Provider<SessionStore> sessionStoreProvider,
      Provider<AuthConfig> authConfigProvider) {
    return new AuthViewModel_Factory(authRepositoryProvider, authManagerProvider, sessionStoreProvider, authConfigProvider);
  }

  public static AuthViewModel newInstance(AuthRepository authRepository, AuthManager authManager,
      SessionStore sessionStore, AuthConfig authConfig) {
    return new AuthViewModel(authRepository, authManager, sessionStore, authConfig);
  }
}
