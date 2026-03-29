import { SettingsProvider } from '@/context/SettingsContext';
import type { UserProfile } from '@/types';
import { setupAndroidChannel } from '@/utils/notifications';
import { readStorage, STORAGE_KEYS } from '@/utils/storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { router, Stack, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../global.css';

void SplashScreen.preventAutoHideAsync();

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout(): React.JSX.Element {
  const [isReady, setIsReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    void (async () => {
      try {
        if (!isExpoGo) {
          const Notifications = await import('expo-notifications');
          Notifications.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowAlert: true,
              shouldPlaySound: true,
              shouldSetBadge: false,
              shouldShowBanner: true,
shouldShowList: true,
            }),
          });
        }

        await setupAndroidChannel();

        const profile = await readStorage<UserProfile>(STORAGE_KEYS.USER_PROFILE);
        const onboardingComplete = profile?.onboardingComplete ?? false;
        setNeedsOnboarding(!onboardingComplete);
      } catch (error) {
        console.error('Initialization error:', error);
        setNeedsOnboarding(true);
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isReady || !rootNavigationState?.key) return;

    void SplashScreen.hideAsync();

    if (needsOnboarding) {
      const timer = setTimeout(() => {
        router.replace('/onboarding/welcome');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isReady, rootNavigationState?.key, needsOnboarding]);

  // SettingsProvider always wraps the tree so no child ever renders outside it.
  // The Stack is only mounted once isReady is true.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsProvider>
        {isReady ? (
          <>
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
          </>
        ) : null}
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}