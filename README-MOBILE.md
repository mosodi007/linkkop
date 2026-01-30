# Linkkop Mobile App

A React Native mobile application built with Expo for connecting with people nearby.

## Features

- User authentication (email/password and magic link)
- Feed with posts and images
- Discover nearby users
- Send and manage connection requests
- View contacts
- Notifications
- Profile management
- Internationalization (English, Spanish, French)

## Tech Stack

- **React Native** with Expo SDK 52
- **Expo Router** for file-based navigation
- **Supabase** for backend (auth, database, storage)
- **NativeWind** for Tailwind-like styling
- **React Navigation** for navigation
- **i18next** for internationalization

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app (for testing on device)
- iOS Simulator (macOS only) or Android Emulator

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.local` and ensure your Supabase credentials are set
   - The app uses `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Run on device/simulator:**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your device

## Project Structure

```
/project
├── app/                      # Expo Router app directory
│   ├── (tabs)/              # Tab navigation routes
│   │   ├── index.tsx        # Feed
│   │   ├── discover.tsx     # Discover users
│   │   ├── contacts.tsx     # Contacts list
│   │   ├── notifications.tsx # Notifications
│   │   └── profile.tsx      # Profile/Settings
│   ├── auth/                # Authentication routes
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   └── _layout.tsx          # Root layout
├── components/              # Reusable components
│   ├── PostCard.tsx
│   └── UserCard.tsx
├── src/app/
│   ├── lib/                 # Business logic
│   │   ├── auth.native.tsx  # Auth provider
│   │   ├── supabase.native.ts # Supabase client
│   │   └── i18n.native.ts   # i18n config
│   ├── types/               # TypeScript types
│   └── locales/             # Translation files
├── assets/                  # Images, icons, fonts
├── app.json                 # Expo configuration
├── global.css              # NativeWind styles
└── package.json
```

## Features to Implement

The following features are placeholders and need implementation:

- [ ] Create post functionality
- [ ] Edit profile
- [ ] Post image upload with camera/gallery
- [ ] Profile photo upload
- [ ] Location services integration
- [ ] Real-time notifications
- [ ] Like and comment on posts
- [ ] User profile detail pages
- [ ] Privacy settings
- [ ] In-app messaging

## Database

The app uses Supabase PostgreSQL with the following tables:

- `profiles` - User profiles
- `posts` - User posts
- `connection_requests` - Connection requests
- `contacts` - Accepted connections
- `notifications` - User notifications
- `profiles_discover` - Browse-only users (mock data)
- `posts_discover` - Mock posts

## Assets

Replace placeholder assets in the `/assets` directory:

- `icon.png` - App icon (1024x1024)
- `splash.png` - Splash screen (1284x2778 for iOS)
- `adaptive-icon.png` - Android adaptive icon (1024x1024)
- `favicon.png` - Web favicon (48x48)

## Building for Production

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Configure EAS:**
   ```bash
   eas build:configure
   ```

3. **Build for iOS:**
   ```bash
   eas build --platform ios
   ```

4. **Build for Android:**
   ```bash
   eas build --platform android
   ```

## Deployment

- iOS: Submit to App Store via EAS Submit
- Android: Submit to Google Play via EAS Submit

## Environment Variables

Required environment variables:

- `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Permissions

The app requires the following permissions:

- **Camera** - For taking profile photos and post images
- **Photo Library** - For selecting photos from gallery
- **Location** - For discovering nearby users (when in use)

## Troubleshooting

**Metro bundler errors:**
- Clear cache: `npx expo start -c`
- Reinstall node_modules: `rm -rf node_modules && npm install`

**TypeScript errors:**
- Restart TypeScript server in your editor
- Run `npx tsc --noEmit` to check for errors

**Supabase connection issues:**
- Verify environment variables are set correctly
- Check network connection
- Ensure Supabase project is active

## License

Private
