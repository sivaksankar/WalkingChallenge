package com.walkingchallenge.app.di;

import com.walkingchallenge.app.data.remote.WalkingChallengeApi;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;
import retrofit2.Retrofit;

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
public final class NetworkModule_ProvideWalkingChallengeApiFactory implements Factory<WalkingChallengeApi> {
  private final Provider<Retrofit> retrofitProvider;

  public NetworkModule_ProvideWalkingChallengeApiFactory(Provider<Retrofit> retrofitProvider) {
    this.retrofitProvider = retrofitProvider;
  }

  @Override
  public WalkingChallengeApi get() {
    return provideWalkingChallengeApi(retrofitProvider.get());
  }

  public static NetworkModule_ProvideWalkingChallengeApiFactory create(
      Provider<Retrofit> retrofitProvider) {
    return new NetworkModule_ProvideWalkingChallengeApiFactory(retrofitProvider);
  }

  public static WalkingChallengeApi provideWalkingChallengeApi(Retrofit retrofit) {
    return Preconditions.checkNotNullFromProvides(NetworkModule.INSTANCE.provideWalkingChallengeApi(retrofit));
  }
}
