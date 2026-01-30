# Quick Start Guide - Linkkop Mobile App

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18 or higher ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Expo Go** app on your mobile device:
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

For simulator/emulator development:
- **Xcode** (macOS only) for iOS simulator
- **Android Studio** for Android emulator

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Verify environment variables:**

   The `.env.local` file should contain:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

## Running the App

### Option 1: On Your Physical Device (Recommended)

1. **Start the Expo development server:**
   ```bash
   npm start
   ```

2. **Scan the QR code:**
   - **iOS:** Open the Camera app and scan the QR code
   - **Android:** Open the Expo Go app and scan the QR code

3. The app will load on your device!

### Option 2: On iOS Simulator (macOS only)

1. **Start the development server:**
   ```bash
   npm start
   ```

2. **Press `i` in the terminal** or run:
   ```bash
   npm run ios
   ```

### Option 3: On Android Emulator

1. **Start Android emulator** from Android Studio

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Press `a` in the terminal** or run:
   ```bash
   npm run android
   ```

## First-Time Setup

### Testing Authentication

1. **Sign Up:**
   - Open the app
   - Tap "Sign up"
   - Enter email and password
   - Complete registration

2. **Sign In:**
   - Use your registered credentials
   - Or use magic link (check email)

### Exploring Features

The app has 5 main tabs:

1. **Feed** - View posts from users
2. **Discover** - Browse and connect with users
3. **Contacts** - View your connections
4. **Notifications** - See activity updates
5. **Profile** - Manage your account

## Common Commands

```bash
# Start development server
npm start

# Start with cache cleared
npm start -- --clear

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web (experimental)
npm run web

# Install new dependency
npm install <package-name>

# Type check
npx tsc --noEmit
```

## Troubleshooting

### Cannot connect to Metro bundler

**Solution:**
```bash
# Clear cache and restart
npm start -- --clear
```

### Module not found errors

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### iOS build fails

**Solution:**
```bash
# Make sure Xcode Command Line Tools are installed
xcode-select --install

# Update CocoaPods
cd ios && pod install && cd ..
```

### Android build fails

**Solution:**
- Open Android Studio
- Go to SDK Manager
- Install latest Android SDK and build tools
- Sync Gradle files

### Supabase connection issues

**Solution:**
1. Verify `.env.local` has correct credentials
2. Check internet connection
3. Restart Metro bundler
4. Check Supabase dashboard for project status

## Development Tips

### Hot Reload

Expo supports hot reloading. Changes to your code will automatically refresh the app.

To manually refresh:
- **iOS/Android:** Shake device and select "Reload"
- **Simulator:** Press `Cmd+R` (iOS) or `R+R` (Android)

### Debug Menu

To open the debug menu:
- **Physical device:** Shake your device
- **iOS Simulator:** `Cmd+D` or `Ctrl+Cmd+Z`
- **Android Emulator:** `Cmd+M` (macOS) or `Ctrl+M` (Windows/Linux)

### Debugging

1. **Console Logs:**
   - View in terminal where Metro is running
   - Or use React Native Debugger

2. **Element Inspector:**
   - Open debug menu
   - Select "Show Element Inspector"
   - Tap elements to inspect

3. **Network Requests:**
   - Open debug menu
   - Enable "Debug Remote JS"
   - Use browser dev tools

## Project Structure Overview

```
app/
├── (tabs)/           # Main app screens with bottom navigation
├── auth/            # Authentication screens
└── _layout.tsx      # Root layout

components/          # Reusable UI components

src/app/
├── lib/            # Business logic (auth, supabase, i18n)
├── types/          # TypeScript type definitions
└── locales/        # Translation files

assets/             # Images, icons, splash screens
```

## Next Steps

1. **Customize the app:**
   - Update colors in `tailwind.config.js`
   - Add your logo to `assets/`
   - Modify translations in `src/locales/`

2. **Add features:**
   - Implement create post
   - Add image uploads
   - Enable location services
   - Build real-time features

3. **Prepare for production:**
   - Replace placeholder assets
   - Set up EAS Build for app stores
   - Configure app signing
   - Test on multiple devices

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)

## Getting Help

If you encounter issues:

1. Check the [Expo Forums](https://forums.expo.dev/)
2. Search [Stack Overflow](https://stackoverflow.com/questions/tagged/expo)
3. Review [Supabase Discord](https://discord.supabase.com/)
4. Check the project's `CONVERSION-SUMMARY.md` for details

## Happy Coding! 🚀
