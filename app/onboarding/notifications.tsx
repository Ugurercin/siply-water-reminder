import type { UserProfile } from '@/types';
import { readStorage, STORAGE_KEYS, writeUserProfile } from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Benefit Row ──────────────────────────────────────────────────────────────

interface BenefitRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  text: string;
}

function BenefitRow({ icon, text }: BenefitRowProps): React.JSX.Element {
  return (
    <View className="flex-row items-center gap-4 mb-4">
      <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
        <Ionicons name={icon} size={20} color="#2DC8A0" />
      </View>
      <Text className="text-foreground text-base flex-1">{text}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

async function finishOnboarding(): Promise<void> {
  const profile = await readStorage<UserProfile>(STORAGE_KEYS.USER_PROFILE);
  if (profile !== null) {
    await writeUserProfile({ ...profile, onboardingComplete: true });
  }
}

async function setupAndroidChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('hydration', {
      name: 'Hydration Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

export default function NotificationsScreen(): React.JSX.Element {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleAllow = async (): Promise<void> => {
    if (isRequesting) return;
    setIsRequesting(true);

    await setupAndroidChannel();
    await Notifications.requestPermissionsAsync();
    // We proceed regardless of whether the user grants permission —
    // they can always enable it later in Settings.
    await finishOnboarding();

    setIsRequesting(false);
    router.replace('/(tabs)');
  };

  const handleSkip = async (): Promise<void> => {
    await finishOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View className="flex-1 px-6 pt-8 justify-between">
        {/* Top content */}
        <Animated.View entering={FadeInDown.duration(500).springify()}>
          <View className="items-center mb-10">
            <View className="w-28 h-28 rounded-full bg-primary/10 items-center justify-center mb-6">
              <Ionicons name="notifications" size={56} color="#2DC8A0" />
            </View>
            <Text className="text-foreground text-3xl font-bold text-center mb-3">
              Stay on Track
            </Text>
            <Text className="text-muted-foreground text-base text-center leading-6">
              Siply will send gentle reminders so you never forget to hydrate.
            </Text>
          </View>

          <BenefitRow
            icon="time-outline"
            text="Reminders every few hours — you choose the frequency"
          />
          <BenefitRow
            icon="moon-outline"
            text="Quiet hours respected — no notifications while you sleep"
          />
          <BenefitRow
            icon="hand-left-outline"
            text="Turn them off anytime in Settings"
          />
        </Animated.View>

        {/* Buttons */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(300)}
          className="gap-3 pb-2"
        >
          <Pressable
            onPress={handleAllow}
            disabled={isRequesting}
            android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: false }}
            className={`rounded-2xl py-4 items-center ${isRequesting ? 'bg-primary/50' : 'bg-primary'}`}
            style={({ pressed }) => [pressed && { opacity: 0.85 }]}
          >
            <Text className="text-primary-foreground text-base font-bold">
              Allow Reminders
            </Text>
          </Pressable>

          <Pressable
            onPress={handleSkip}
            android_ripple={{ color: 'rgba(0,0,0,0.06)', borderless: false }}
            className="rounded-2xl py-4 items-center"
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
          >
            <Text className="text-muted-foreground text-base">Maybe later</Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
