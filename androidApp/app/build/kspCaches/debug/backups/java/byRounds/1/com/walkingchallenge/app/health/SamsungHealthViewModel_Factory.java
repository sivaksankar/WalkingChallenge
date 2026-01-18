package com.walkingchallenge.app.health;

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
public final class SamsungHealthViewModel_Factory implements Factory<SamsungHealthViewModel> {
  private final Provider<SamsungHealthManager> samsungHealthManagerProvider;

  public SamsungHealthViewModel_Factory(
      Provider<SamsungHealthManager> samsungHealthManagerProvider) {
    this.samsungHealthManagerProvider = samsungHealthManagerProvider;
  }

  @Override
  public SamsungHealthViewModel get() {
    return newInstance(samsungHealthManagerProvider.get());
  }

  public static SamsungHealthViewModel_Factory create(
      Provider<SamsungHealthManager> samsungHealthManagerProvider) {
    return new SamsungHealthViewModel_Factory(samsungHealthManagerProvider);
  }

  public static SamsungHealthViewModel newInstance(SamsungHealthManager samsungHealthManager) {
    return new SamsungHealthViewModel(samsungHealthManager);
  }
}
