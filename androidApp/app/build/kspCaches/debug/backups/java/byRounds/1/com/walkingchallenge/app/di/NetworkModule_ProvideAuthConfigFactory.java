package com.walkingchallenge.app.di;

import com.walkingchallenge.app.auth.AuthConfig;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;

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
public final class NetworkModule_ProvideAuthConfigFactory implements Factory<AuthConfig> {
  @Override
  public AuthConfig get() {
    return provideAuthConfig();
  }

  public static NetworkModule_ProvideAuthConfigFactory create() {
    return InstanceHolder.INSTANCE;
  }

  public static AuthConfig provideAuthConfig() {
    return Preconditions.checkNotNullFromProvides(NetworkModule.INSTANCE.provideAuthConfig());
  }

  private static final class InstanceHolder {
    private static final NetworkModule_ProvideAuthConfigFactory INSTANCE = new NetworkModule_ProvideAuthConfigFactory();
  }
}
