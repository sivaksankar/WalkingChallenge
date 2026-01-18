package com.walkingchallenge.app.auth;

import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

@ScopeMetadata("javax.inject.Singleton")
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
public final class AuthManager_Factory implements Factory<AuthManager> {
  private final Provider<AuthConfig> configProvider;

  public AuthManager_Factory(Provider<AuthConfig> configProvider) {
    this.configProvider = configProvider;
  }

  @Override
  public AuthManager get() {
    return newInstance(configProvider.get());
  }

  public static AuthManager_Factory create(Provider<AuthConfig> configProvider) {
    return new AuthManager_Factory(configProvider);
  }

  public static AuthManager newInstance(AuthConfig config) {
    return new AuthManager(config);
  }
}
