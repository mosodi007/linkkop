import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../lib/auth';
import { ThemeProvider } from '../lib/ThemeContext';
import { getOnboardingComplete } from '../lib/onboarding';
import { isSupabaseConfigured } from '../lib/supabase';
import * as SplashScreen from 'expo-splash-screen';
import '../lib/i18n';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [localOnboarded, setLocalOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      getOnboardingComplete().then(setLocalOnboarded);
    } else {
      setLocalOnboarded(false);
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!isSupabaseConfigured && localOnboarded === null) return;
    SplashScreen.hideAsync().catch(() => {});
    const inAuthGroup = segments[0] === 'auth';
    if (!user && !inAuthGroup) {
      if (!isSupabaseConfigured && localOnboarded === true) {
        router.replace('/(tabs)');
      } else if (isSupabaseConfigured || localOnboarded === false) {
        router.replace('/auth/sign-in');
      }
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments, localOnboarded]);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="user" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
