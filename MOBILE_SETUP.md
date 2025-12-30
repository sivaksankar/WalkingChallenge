# Mobile App Setup Guide

This guide explains how to build and deploy the Walking Challenge native mobile apps for iOS and Android with automatic health data sync.

## Overview

The Walking Challenge app is built with:
- **Web**: Next.js web app (hosted on Netlify)
- **Mobile**: Capacitor wrapper that provides native iOS/Android apps
- **Health Sync**: Automatic step tracking via HealthKit (iOS) and Health Connect (Android)

## Prerequisites

### For Both Platforms
- Node.js 18+ and npm
- Walking Challenge repository cloned locally

### For iOS Development
- macOS computer with Xcode 14+
- Apple Developer account ($99/year for App Store distribution)
- CocoaPods installed: `sudo gem install cocoapods`

### For Android Development
- Android Studio (Arctic Fox or newer)
- Android SDK with API level 33+
- Java JDK 17+

## Initial Setup (Already Complete)

The Capacitor configuration has been initialized with:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init "Walking Challenge" "com.walkingchallenge.app"
npx cap add ios
npx cap add android
npm install @capgo/capacitor-health
```

## Building for Mobile

### 1. Build the Web App

The mobile app loads the production web app from Netlify, so ensure your latest changes are deployed:

```bash
git add .
git commit -m "feat: your changes"
git push origin main
```

Wait for Netlify to build and deploy (check https://app.netlify.com).

### 2. Sync Capacitor

After any changes to the web code or plugins:

```bash
cd walking-challenge
npm run build:mobile
```

This runs `next build && npx cap sync` which:
- Builds the Next.js app
- Copies web assets to native projects
- Updates native dependencies

## iOS App Development

### Open in Xcode

```bash
npm run ios
# Or manually:
npx cap open ios
```

### Configure Signing & Capabilities

1. In Xcode, select the project in the navigator
2. Select the "App" target
3. Go to "Signing & Capabilities"
4. Select your Team (Apple Developer account)
5. Add the **HealthKit** capability:
   - Click "+ Capability"
   - Search for "HealthKit"
   - Enable "Clinical Health Records" if needed

### Test on Simulator/Device

1. Select a simulator or connected iPhone
2. Click the Play button or press Cmd+R
3. Grant Health permissions when prompted
4. Test the health sync feature in the app

### Build for TestFlight/App Store

1. In Xcode, select "Any iOS Device (arm64)"
2. Product → Archive
3. Once archived, click "Distribute App"
4. Choose "App Store Connect"
5. Follow the prompts to upload to TestFlight
6. In App Store Connect, add build to TestFlight for testing

### App Store Submission Checklist

- [ ] App Icon (1024x1024px)
- [ ] Screenshots for required device sizes
- [ ] Privacy Policy URL (required for health data access)
- [ ] App description and keywords
- [ ] Health permissions justification in App Review notes
- [ ] Test the app thoroughly on real devices

## Android App Development

### Open in Android Studio

```bash
npm run android
# Or manually:
npx cap open android
```

### Configure Health Connect

1. The app requires Google Health Connect to be installed
2. Health Connect is pre-installed on Android 14+ devices
3. For older devices, users need to install it from Play Store

### Update Package Name (Optional)

If you want to change from `com.walkingchallenge.app`:

1. Update `capacitor.config.ts`: `appId: 'your.new.package'`
2. Update `android/app/build.gradle`: `applicationId`
3. Refactor package in Android Studio: Right-click package → Refactor → Rename

### Test on Emulator/Device

1. Create/select an Android Virtual Device (AVD) with API 33+
2. Or connect a physical Android device with USB debugging
3. Click Run (green play button) or press Shift+F10
4. Install Health Connect if prompted
5. Grant health permissions when prompted
6. Test the health sync feature

### Build APK for Testing

```bash
cd android
./gradlew assembleRelease
```

APK will be in: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

### Build AAB for Play Store

1. Generate a signing key (one-time):
   ```bash
   keytool -genkey -v -keystore walking-challenge.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias walking-challenge
   ```

2. Create `android/key.properties`:
   ```properties
   storePassword=your_store_password
   keyPassword=your_key_password
   keyAlias=walking-challenge
   storeFile=../walking-challenge.keystore
   ```

3. Update `android/app/build.gradle` to use the signing config (already configured for release builds)

4. Build signed AAB:
   ```bash
   cd android
   ./gradlew bundleRelease
   ```

5. AAB will be in: `android/app/build/outputs/bundle/release/app-release.aab`

### Play Store Submission Checklist

- [ ] App Icon (512x512px)
- [ ] Feature Graphic (1024x500px)
- [ ] Screenshots for required device types
- [ ] Privacy Policy URL
- [ ] App description and store listing
- [ ] Content rating questionnaire
- [ ] Health Connect permissions justification
- [ ] Test on multiple devices and Android versions

## Health Data Permissions

### iOS (HealthKit)

Configured in `ios/App/App/Info.plist`:
- `NSHealthShareUsageDescription`: Explains why we need step count access
- Permissions requested: step count, distance, calories burned

### Android (Health Connect)

Configured in `android/app/src/main/AndroidManifest.xml`:
- `android.permission.health.READ_STEPS`
- `android.permission.health.READ_DISTANCE`
- `android.permission.health.READ_TOTAL_CALORIES_BURNED`

## App Architecture

### How It Works

1. **Web App**: Runs on Netlify with full Next.js features (API routes, SSR, etc.)
2. **Mobile Apps**: Capacitor wraps the web app in a native container
3. **Native Features**: JavaScript bridge allows web code to call native APIs
4. **Health Sync**: `nativeHealthService.ts` uses `@capgo/capacitor-health` plugin
5. **API Integration**: Mobile apps call the same Netlify backend APIs

### Key Files

- `capacitor.config.ts`: Capacitor configuration
- `src/services/nativeHealthService.ts`: Native health data service
- `src/components/HealthSync.tsx`: UI component with native support
- `ios/App/App/Info.plist`: iOS permissions and capabilities
- `android/app/src/main/AndroidManifest.xml`: Android permissions

## Development Workflow

### Making Changes

1. Update React components or services
2. Test in web browser first: `npm run dev`
3. Build and sync: `npm run build:mobile`
4. Test in iOS simulator/Android emulator
5. Commit and push changes
6. Netlify auto-deploys web app
7. Build new mobile app versions for stores

### Debugging

**iOS:**
- Use Xcode console for native logs
- Safari Developer → Develop → [Device] → inspect web content
- `console.log()` statements appear in Safari inspector

**Android:**
- Use Android Studio Logcat for native logs
- Chrome DevTools: `chrome://inspect` → inspect WebView
- `console.log()` statements appear in Chrome DevTools

### Common Issues

**iOS: Health permissions not working**
- Check Info.plist has usage descriptions
- Verify HealthKit capability is enabled
- Reset permissions: Settings → Privacy & Security → Health → [App] → Delete All Data

**Android: Health Connect not found**
- Requires Android 13+ or Health Connect app installed
- Check AndroidManifest.xml has correct permissions
- Enable in Settings → Apps → Health Connect

**Build errors after plugin changes**
- Run `npx cap sync` to update native projects
- Clean build: Xcode → Product → Clean Build Folder
- Clean build: Android Studio → Build → Clean Project

## Publishing Updates

### iOS Updates
1. Increment version in `ios/App/App.xcodeproj`
2. Archive and upload to App Store Connect
3. Submit for App Review
4. Typical review time: 1-3 days

### Android Updates
1. Increment `versionCode` and `versionName` in `android/app/build.gradle`
2. Build signed AAB
3. Upload to Google Play Console → Production/Beta/Alpha track
4. Typical review time: Hours to 1 day

## Cost Considerations

### Apple
- **Developer Account**: $99/year
- **App Store**: No per-app fee
- **TestFlight**: Free for up to 10,000 testers

### Google
- **Developer Account**: $25 one-time fee
- **Play Store**: No per-app fee
- **Internal Testing**: Free unlimited testers

### Hosting
- **Netlify**: Current web app (already paid/free tier)
- **Mobile Apps**: No additional hosting costs (apps are distributed via stores)

## Support & Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [HealthKit Guide](https://developer.apple.com/documentation/healthkit)
- [Health Connect Guide](https://developer.android.com/health-and-fitness/guides/health-connect)
- [@capgo/capacitor-health Plugin](https://github.com/Cap-go/capacitor-health)

## Next Steps

1. ✅ Set up development environment (macOS for iOS, or Windows/Linux/macOS for Android)
2. ✅ Open projects in Xcode/Android Studio
3. ✅ Test health sync on real devices
4. ⬜ Create app icons and screenshots
5. ⬜ Write privacy policy
6. ⬜ Register Apple Developer account
7. ⬜ Register Google Play Developer account
8. ⬜ Submit to App Store and Play Store
9. ⬜ Promote the mobile apps to users

---

**Questions or issues?** Open a GitHub issue or check the Capacitor community forums.
