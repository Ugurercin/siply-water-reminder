import { ConfettiCelebration } from '@/components/ConfettiCelebration';
import { DrinkButton } from '@/components/DrinkButton';
import { ProgressRing } from '@/components/ProgressRing';
import { AVATARS } from '@/constants/avatars';
import { THEME_PALETTE } from '@/constants/themes';
import { useSettingsContext } from '@/context/SettingsContext';
import { useHistory } from '@/hooks/useHistory';
import { useWaterStore } from '@/hooks/useWaterStore';
import type { DrinkEntry, DrinkType, VolumeUnit } from '@/types';
import { DRINK_TYPES } from '@/types';
import { formatTime } from '@/utils/dateHelpers';
import { clearAllStorage } from '@/utils/storage';
import { formatVolume } from '@/utils/units';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const QUICK_ADD_AMOUNTS_ML = [250, 500] as const;

const DRINK_LABELS: Record<DrinkType, string> = {
  water: 'Water',
  coffee: 'Coffee',
  tea: 'Tea',
  juice: 'Juice',
  sports: 'Sports',
};

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const DRINK_ICONS: Record<DrinkType, IoniconsName> = {
  water: 'water-outline',
  coffee: 'cafe-outline',
  tea: 'leaf-outline',
  juice: 'nutrition-outline',
  sports: 'fitness-outline',
};

function getMotivationalMessage(progress: number): string {
  if (progress >= 1) return 'Goal reached! Amazing work today!';
  if (progress >= 0.75) return 'Almost there — just a bit more!';
  if (progress >= 0.5) return "Halfway there! You're doing great!";
  if (progress >= 0.25) return 'Great start! Keep it up!';
  return "Let's start hydrating!";
}

interface DrinkEntryRowProps {
  entry: DrinkEntry;
  volumeUnit: VolumeUnit;
  onRemove: (id: string) => void;
  isLast: boolean;
}

function DrinkEntryRow({
  entry,
  volumeUnit,
  onRemove,
  isLast,
}: DrinkEntryRowProps): React.JSX.Element {
  const iconName = DRINK_ICONS[entry.drinkType];
  const label = DRINK_LABELS[entry.drinkType];

  return (
    <View
      className={`flex-row items-center px-4 py-3 ${!isLast ? 'border-b border-border' : ''}`}
    >
      <View className="w-9 h-9 rounded-full bg-secondary items-center justify-center mr-3">
        <Ionicons name={iconName} size={18} color="#2DC8A0" />
      </View>

      <View className="flex-1">
        <Text className="text-foreground text-sm font-bold">{label}</Text>
        <Text className="text-muted-foreground text-xs mt-0.5">
          {formatTime(entry.timestamp)}
        </Text>
      </View>

      <Text className="text-foreground text-sm font-bold mr-3">
        {formatVolume(entry.amountMl, volumeUnit)}
      </Text>

      <Pressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onRemove(entry.id);
        }}
        android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: true }}
        style={({ pressed }) => [
          pressed && Platform.OS === 'ios' ? { opacity: 0.5 } : undefined,
        ]}
        hitSlop={8}
      >
        <Ionicons name="trash-outline" size={16} color="#9CA3AF" />
      </Pressable>
    </View>
  );
}

export default function HomeScreen(): React.JSX.Element {
  const { profile, settings } = useSettingsContext();
  const { todayLog, addDrink, removeDrink, refresh } = useWaterStore(profile.dailyGoalMl);
  const { stats } = useHistory();

  const [showConfetti, setShowConfetti] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const volumeUnit = settings.volumeUnit;
  const themeColors = THEME_PALETTE[settings.theme];
  const avatarConfig = AVATARS[settings.avatar];

  const totalMl = todayLog?.totalMl ?? 0;
  const goalMl = todayLog?.goalMl ?? profile.dailyGoalMl;
  const progress = goalMl > 0 ? totalMl / goalMl : 0;
  const percentage = Math.min(100, Math.round(progress * 100));
  const goalReached = todayLog?.goalReached === true;

  const triggerGoalCelebration = (): void => {
    setShowConfetti(false);
    setTimeout(() => setShowConfetti(true), 0);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleQuickAdd = (amountMl: number): void => {
    const wasBelowGoal = totalMl < goalMl;
    const willReachGoal = totalMl + amountMl >= goalMl;

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (wasBelowGoal && willReachGoal) {
      triggerGoalCelebration();
    }

    void addDrink(DRINK_TYPES.WATER, amountMl);
  };

  const handleCustomAdd = (): void => {
    router.push('/modals/log-drink');
  };

  const handleRemove = (id: string): void => {
    void removeDrink(id);
  };

  const handleDevReset = (): void => {
    void (async () => {
      await clearAllStorage();
      router.replace('/onboarding/welcome');
    })();
  };

  const entries = todayLog?.entries ?? [];
  const reversedEntries = [...entries].reverse();

  return (
    <SafeAreaView className="bg-background" style={{ flex: 1 }} edges={['top', 'bottom']}>
      <StatusBar style="auto" />

      <View style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
            <View>
              <Text className="text-foreground text-2xl font-bold">Today</Text>
              <Text className="text-muted-foreground text-sm">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>

            {stats.currentStreak > 0 && (
              <View className="flex-row items-center bg-secondary rounded-full px-3 py-1.5">
                <Text className="text-base mr-1">🔥</Text>
                <Text className="text-primary text-sm font-bold">
                  {stats.currentStreak} day{stats.currentStreak !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>

          <View className="items-center py-8">
            <ProgressRing
              progress={progress}
              size={240}
              strokeWidth={20}
              color={themeColors.primary}
              trackColor={themeColors.primaryLight}
            >
              <View className="items-center">
                <Ionicons
                  name={avatarConfig.icon as React.ComponentProps<typeof Ionicons>['name']}
                  size={26}
                  color={themeColors.primary}
                  style={{ marginBottom: 2 }}
                />
                <Text
                  className="text-foreground font-bold"
                  style={{ fontSize: 44, lineHeight: 52 }}
                >
                  {percentage}%
                </Text>
                <Text className="text-muted-foreground text-sm mt-1">
                  {formatVolume(totalMl, volumeUnit)}
                </Text>
                <Text className="text-muted-foreground text-xs">
                  of {formatVolume(goalMl, volumeUnit)}
                </Text>
              </View>
            </ProgressRing>
          </View>

          <View className="items-center px-8 pb-6">
            <Text className="text-foreground text-base text-center font-bold">
              {getMotivationalMessage(progress)}
            </Text>
            {goalReached && (
              <Text className="text-muted-foreground text-sm text-center mt-1">
                Keep going — extra hydration is always welcome!
              </Text>
            )}
          </View>

          <View className="px-4 pb-6">
            <Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-3 px-2">
              Quick Add
            </Text>
            <View className="flex-row">
              {QUICK_ADD_AMOUNTS_ML.map((amountMl) => (
                <DrinkButton
                  key={amountMl}
                  label={formatVolume(amountMl, volumeUnit)}
                  onPress={() => handleQuickAdd(amountMl)}
                />
              ))}
              <DrinkButton label="+ Custom" onPress={handleCustomAdd} />
            </View>
          </View>

          <View className="mx-4">
            <View className="flex-row items-center justify-between mb-3 px-2">
              <Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                Today's Log
              </Text>
              <Text className="text-muted-foreground text-xs">
                {entries.length} {entries.length === 1 ? 'drink' : 'drinks'}
              </Text>
            </View>

            <View className="bg-card rounded-2xl overflow-hidden">
              {reversedEntries.length === 0 ? (
                <View className="items-center py-10 px-6">
                  <Ionicons name="water-outline" size={40} color="#9CA3AF" />
                  <Text className="text-muted-foreground text-sm text-center mt-3">
                    No drinks logged yet.{'\n'}Tap a quick-add button to get started!
                  </Text>
                </View>
              ) : (
                reversedEntries.map((entry, index) => (
                  <DrinkEntryRow
                    key={entry.id}
                    entry={entry}
                    volumeUnit={volumeUnit}
                    onRemove={handleRemove}
                    isLast={index === reversedEntries.length - 1}
                  />
                ))
              )}
            </View>
          </View>

          {progress < 0.5 && entries.length > 0 && (
            <View className="mx-4 mt-4 bg-accent rounded-2xl px-4 py-3 flex-row items-center">
              <Text className="text-lg mr-2">💡</Text>
              <Text className="text-accent-foreground text-xs flex-1">
                Tip: Keep a water bottle at your desk to drink more consistently.
              </Text>
            </View>
          )}
        </ScrollView>

        <ConfettiCelebration active={showConfetti} />
      </View>

      {__DEV__ && (
        <Pressable
          onPress={handleDevReset}
          style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            backgroundColor: '#FF3B30',
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 6,
            opacity: 0.85,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>
            DEV RESET
          </Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}