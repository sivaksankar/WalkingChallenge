# Keep Retrofit models serialized with Kotlinx Serialization
-keep class kotlinx.serialization.** { *; }
-keepclassmembers class **$Companion { *; }

# WorkManager serializable workers
-keep class androidx.work.ListenableWorker { *; }
# Hilt generated classes
-keep class dagger.hilt.internal.** { *; }
-dontwarn dagger.hilt.internal.**
