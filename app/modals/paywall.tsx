import { usePurchases } from '@/hooks/usePurchases';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Pack Config ──────────────────────────────────────────────────────────────

interface PackFeature {
  text: string;
}

interface PackConfig {
  id: 'theme' | 'power';
  emoji: string;
  title: string;
  subtitle: string;
  price: string;
  features: PackFeature[];
}

const PACKS: PackConfig[] = [
  {
    id: 'theme',
    emoji: '🎨',
    title: 'Theme Pack',
    subtitle: 'Personalize your experience',
    price: '$0.99',
    features: [
      { text: '4 color themes: Ocean, Forest, Sunset, Midnight' },
      { text: 'Custom progress ring avatars' },
      { text: 'One-time purchase, no subscription' },
    ],
  },
  {
    id: 'power',
    emoji: '⚡',
    title: 'Power Pack',
    subtitle: 'Deep insights & full control',
    price: '$1.99',
    features: [
      { text: '30+ days of detailed history charts' },
      { text: 'All drink types: coffee, tea, juice, sports' },
      { text: 'Goal hit rate & monthly trend analysis' },
      { text: 'CSV export of all your data' },
      { text: 'One-time purchase, no subscription' },
    ],
  },
];

// ─── Paywall Modal ────────────────────────────────────────────────────────────

export default function PaywallModal(): React.JSX.Element {
  const { hasThemePack, hasPowerPack, purchaseThemePack, purchasePowerPack, restorePurchases } =
    usePurchases();

  const isOwned = (packId: 'theme' | 'power'): boolean =>
    packId === 'theme' ? hasThemePack : hasPowerPack;

  const handlePurchase = (packId: 'theme' | 'power'): void => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    void (async () => {
      if (packId === 'theme') {
        await purchaseThemePack();
      } else {
        await purchasePowerPack();
      }
      router.back();
    })();
  };

  const handleRestore = (): void => {
    void (async () => {
      const result = await restorePurchases();
      // Brief haptic regardless of outcome
      if (result === 'restored') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    })();
  };

  return (
    <SafeAreaView className="bg-background" style={{ flex: 1 }} edges={['bottom']}>
      <StatusBar style="auto" />

      {/* Handle bar */}
      <View className="items-center pt-3 pb-1">
        <View className="w-10 h-1 rounded-full bg-border" />
      </View>

      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <View>
          <Text className="text-foreground text-xl font-bold">Unlock More</Text>
          <Text className="text-muted-foreground text-sm">One-time purchases, no subscriptions</Text>
        </View>
        <Pressable
          onPress={() => router.back()}
          android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: true }}
          style={({ pressed }) => [
            pressed && Platform.OS === 'ios' ? { opacity: 0.6 } : undefined,
          ]}
          hitSlop={12}
        >
          <Ionicons name="close" size={24} color="#9CA3AF" />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Pack Cards ──────────────────────────────────────────────────── */}
        {PACKS.map((pack) => {
          const owned = isOwned(pack.id);
          return (
            <View key={pack.id} className="bg-card rounded-2xl mb-4 overflow-hidden">
              {/* Card header */}
              <View className="px-4 pt-4 pb-3 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-11 h-11 rounded-xl bg-secondary items-center justify-center mr-3">
                    <Text style={{ fontSize: 22 }}>{pack.emoji}</Text>
                  </View>
                  <View>
                    <Text className="text-foreground text-base font-bold">{pack.title}</Text>
                    <Text className="text-muted-foreground text-xs mt-0.5">{pack.subtitle}</Text>
                  </View>
                </View>
                <Text className="text-primary text-lg font-bold">{pack.price}</Text>
              </View>

              {/* Feature list */}
              <View className="border-t border-border px-4 py-3">
                {pack.features.map((feature) => (
                  <View key={feature.text} className="flex-row items-start mb-2">
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#2DC8A0"
                      style={{ marginRight: 8, marginTop: 1 }}
                    />
                    <Text className="text-foreground text-sm flex-1">{feature.text}</Text>
                  </View>
                ))}
              </View>

              {/* Buy / Owned button */}
              <View className="px-4 pb-4">
                {owned ? (
                  <View className="bg-secondary rounded-xl py-3 flex-row items-center justify-center">
                    <Ionicons name="checkmark-circle" size={16} color="#2DC8A0" style={{ marginRight: 6 }} />
                    <Text className="text-primary text-base font-bold">Owned</Text>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => handlePurchase(pack.id)}
                    android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: false }}
                    style={({ pressed }) => [
                      pressed && Platform.OS === 'ios' ? { opacity: 0.85 } : undefined,
                    ]}
                    className="bg-primary rounded-xl py-3.5 items-center"
                  >
                    <Text className="text-primary-foreground text-base font-bold">
                      Buy {pack.title} · {pack.price}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        })}

        {/* ── Restore Purchases ────────────────────────────────────────────── */}
        <Pressable
          onPress={handleRestore}
          android_ripple={{ color: 'rgba(0,0,0,0.06)', borderless: true }}
          style={({ pressed }) => [
            pressed && Platform.OS === 'ios' ? { opacity: 0.6 } : undefined,
          ]}
          className="items-center py-3"
        >
          <Text className="text-muted-foreground text-sm">Restore previous purchases</Text>
        </Pressable>

        {/* ── Mock mode notice ─────────────────────────────────────────────── */}
        <View className="items-center pt-1 pb-2">
          <Text className="text-muted-foreground text-xs text-center">
            🛠 Mock mode · Purchases are simulated and not charged
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
