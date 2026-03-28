import type { UserProfile } from '@/types';
import { readStorage, STORAGE_KEYS } from '@/utils/storage';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../global.css';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout(): React.JSX.Element {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const profile = await readStorage<UserProfile>(STORAGE_KEYS.USER_PROFILE);
        const onboardingComplete = profile?.onboardingComplete ?? false;
        setIsReady(true);
        await SplashScreen.hideAsync();
        if (!onboardingComplete) {
          router.replace('/onboarding/welcome');
        }
      } catch {
        setIsReady(true);
        await SplashScreen.hideAsync();
        router.replace('/onboarding/welcome');
      }
    })();
  }, []);

  if (!isReady) return null as unknown as React.JSX.Element;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen
          name="modals/log-drink"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="modals/paywall"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}