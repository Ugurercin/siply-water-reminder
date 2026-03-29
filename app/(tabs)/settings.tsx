import { AVATARS } from '@/constants/avatars';
import { THEME_PALETTE, THEMES } from '@/constants/themes';
import { useSettingsContext } from '@/context/SettingsContext';
import { usePurchases } from '@/hooks/usePurchases';
import type { Avatar, Theme, VolumeUnit, WeightUnit } from '@/types';
import { calculateDailyGoalMl } from '@/utils/goalCalculator';
import { clearAllStorage } from '@/utils/storage';
import { formatVolume } from '@/utils/units';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, Platform, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────────────────────

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface ThemeOption {
  key: Theme;
  label: string;
  color: string;
  free: boolean;
}

interface AvatarOption {
  key: Avatar;
  label: string;
  icon: IoniconsName;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GOAL_STEP_ML = 50;
const MIN_GOAL_ML = 1500;
const MAX_GOAL_ML = 4000;

const VOLUME_UNITS: VolumeUnit[] = ['ml', 'oz', 'cups'];
const WEIGHT_UNITS: WeightUnit[] = ['kg', 'lbs'];
const REMINDER_INTERVALS = [1, 2, 3, 4] as const;

const THEME_OPTIONS: ThemeOption[] = Object.values(THEMES).map((t) => ({
  key: t.key,
  label: t.label,
  color: t.colors.primary,
  free: !t.isPremium,
}));

const AVATAR_OPTIONS: AvatarOption[] = Object.values(AVATARS).map((a) => ({
  key: a.key,
  label: a.label,
  icon: a.icon as IoniconsName,
}));

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }): React.JSX.Element {
  return (
    <Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-3 px-6">
      {label}
    </Text>
  );
}

// ─── Settings Screen ──────────────────────────────────────────────────────────

export default function SettingsScreen(): React.JSX.Element {
  const { profile, settings, updateProfile, updateSettings } = useSettingsContext();
  const {
    hasThemePack,
    hasPowerPack,
    restorePurchases: doRestorePurchases,
    devToggleThemePack,
    devTogglePowerPack,
  } = usePurchases();

  const volumeUnit = settings.volumeUnit;
  const themeColors = THEME_PALETTE[settings.theme];

  const isThemeUnlocked = (option: ThemeOption): boolean => option.free || hasThemePack;

  // ── Goal handlers ──────────────────────────────────────────────────────────

  const handleGoalDecrease = (): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void updateProfile({ dailyGoalMl: Math.max(MIN_GOAL_ML, profile.dailyGoalMl - GOAL_STEP_ML) });
  };

  const handleGoalIncrease = (): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void updateProfile({ dailyGoalMl: Math.min(MAX_GOAL_ML, profile.dailyGoalMl + GOAL_STEP_ML) });
  };

  const handleRecalculate = (): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newGoal = calculateDailyGoalMl({
      weight: profile.weightKg,
      weightUnit: 'kg',
      activityLevel: profile.activityLevel,
    });
    void updateProfile({ dailyGoalMl: newGoal });
  };

  // ── Appearance handlers ────────────────────────────────────────────────────

  const handleThemePress = (option: ThemeOption): void => {
    if (!isThemeUnlocked(option)) {
      router.push('/modals/paywall');
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void updateSettings({ theme: option.key });
  };

  const handleAvatarPress = (option: AvatarOption): void => {
    if (!hasThemePack) {
      router.push('/modals/paywall');
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void updateSettings({ avatar: option.key });
  };

  // ── More handlers ──────────────────────────────────────────────────────────

  const handleRestorePurchases = (): void => {
    void (async () => {
      const result = await doRestorePurchases();
      Alert.alert(
        'Restore Purchases',
        result === 'restored'
          ? 'Your purchases have been restored!'
          : 'No previous purchases found.',
        [{ text: 'OK' }]
      );
    })();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView className="bg-background" style={{ flex: 1 }} edges={['top', 'bottom']}>
      <StatusBar style="auto" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View className="px-6 pt-4 pb-6">
          <Text className="text-foreground text-2xl font-bold">Settings</Text>
        </View>

        {/* ── Daily Goal ─────────────────────────────────────────────────── */}
        <SectionHeader label="Daily Goal" />
        <View className="mx-4 bg-card rounded-2xl mb-6">
          <View className="px-4 py-4">
            <View className="flex-row items-center justify-between">
              {/* Current goal */}
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-full bg-secondary items-center justify-center mr-3">
                  <Ionicons name="water-outline" size={18} color={themeColors.primary} />
                </View>
                <View>
                  <Text className="text-foreground text-xl font-bold">
                    {formatVolume(profile.dailyGoalMl, volumeUnit)}
                  </Text>
                  <Text className="text-muted-foreground text-xs">per day</Text>
                </View>
              </View>

              {/* +/- buttons */}
              <View className="flex-row items-center">
                <Pressable
                  onPress={handleGoalDecrease}
                  disabled={profile.dailyGoalMl <= MIN_GOAL_ML}
                  android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: false }}
                  style={({ pressed }) => [
                    pressed && Platform.OS === 'ios' ? { opacity: 0.6 } : undefined,
                  ]}
                  className={`w-10 h-10 rounded-xl items-center justify-center bg-secondary mr-2 ${
                    profile.dailyGoalMl <= MIN_GOAL_ML ? 'opacity-40' : ''
                  }`}
                >
                  <Text className="text-foreground text-xl font-bold">−</Text>
                </Pressable>
                <Pressable
                  onPress={handleGoalIncrease}
                  disabled={profile.dailyGoalMl >= MAX_GOAL_ML}
                  android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: false }}
                  style={({ pressed }) => [
                    pressed && Platform.OS === 'ios' ? { opacity: 0.6 } : undefined,
                  ]}
                  className={`w-10 h-10 rounded-xl items-center justify-center bg-secondary ${
                    profile.dailyGoalMl >= MAX_GOAL_ML ? 'opacity-40' : ''
                  }`}
                >
                  <Text className="text-foreground text-xl font-bold">+</Text>
                </Pressable>
              </View>
            </View>

            {/* Recalculate from profile */}
            <Pressable
              onPress={handleRecalculate}
              android_ripple={{ color: 'rgba(0,0,0,0.06)', borderless: true }}
              style={({ pressed }) => [
                pressed && Platform.OS === 'ios' ? { opacity: 0.6 } : undefined,
              ]}
              className="flex-row items-center mt-3 self-start"
              hitSlop={8}
            >
              <Ionicons name="refresh-outline" size={13} color="#9CA3AF" />
              <Text className="text-muted-foreground text-xs ml-1">
                Recalculate from profile
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ── Measurement Units ───────────────────────────────────────────── */}
        <SectionHeader label="Measurement Units" />
        <View className="mx-4 bg-card rounded-2xl mb-6 overflow-hidden">
          {/* Volume */}
          <View className="flex-row items-center px-4 py-3 border-b border-border">
            <Text className="text-foreground text-base flex-1">Volume</Text>
            <View className="flex-row">
              {VOLUME_UNITS.map((unit) => {
                const isSelected = settings.volumeUnit === unit;
                return (
                  <Pressable
                    key={unit}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      void updateSettings({ volumeUnit: unit });
                    }}
                    android_ripple={{ color: 'rgba(45,200,160,0.15)', borderless: false }}
                    style={({ pressed }) => [
                      pressed && Platform.OS === 'ios' ? { opacity: 0.7 } : undefined,
                      { marginLeft: 6 },
                    ]}
                    className={`px-3 py-1.5 rounded-xl ${isSelected ? 'bg-primary' : 'bg-secondary'}`}
                  >
                    <Text
                      className={`text-sm font-bold ${
                        isSelected ? 'text-primary-foreground' : 'text-primary'
                      }`}
                    >
                      {unit}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Weight */}
          <View className="flex-row items-center px-4 py-3">
            <Text className="text-foreground text-base flex-1">Weight</Text>
            <View className="flex-row">
              {WEIGHT_UNITS.map((unit) => {
                const isSelected = settings.weightUnit === unit;
                return (
                  <Pressable
                    key={unit}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      void updateSettings({ weightUnit: unit });
                    }}
                    android_ripple={{ color: 'rgba(45,200,160,0.15)', borderless: false }}
                    style={({ pressed }) => [
                      pressed && Platform.OS === 'ios' ? { opacity: 0.7 } : undefined,
                      { marginLeft: 6 },
                    ]}
                    className={`px-3 py-1.5 rounded-xl ${isSelected ? 'bg-primary' : 'bg-secondary'}`}
                  >
                    <Text
                      className={`text-sm font-bold ${
                        isSelected ? 'text-primary-foreground' : 'text-primary'
                      }`}
                    >
                      {unit}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── Reminders ──────────────────────────────────────────────────── */}
        <SectionHeader label="Reminders" />
        <View className="mx-4 bg-card rounded-2xl mb-6 overflow-hidden">
          {/* Enabled toggle */}
          <View className="flex-row items-center px-4 py-3 border-b border-border">
            <Text className="text-foreground text-base flex-1">Daily reminders</Text>
            <Switch
              value={settings.reminderEnabled}
              onValueChange={(value) => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                void updateSettings({ reminderEnabled: value });
              }}
              trackColor={{ false: '#E5E7EB', true: themeColors.primary }}
              thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
            />
          </View>

          {/* Interval — only shown when enabled */}
          {settings.reminderEnabled && (
            <View className="px-4 py-3">
              <Text className="text-muted-foreground text-xs mb-3">Remind every</Text>
              <View className="flex-row">
                {REMINDER_INTERVALS.map((hours) => {
                  const isSelected = settings.reminderIntervalHours === hours;
                  return (
                    <Pressable
                      key={hours}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        void updateSettings({ reminderIntervalHours: hours });
                      }}
                      android_ripple={{ color: 'rgba(45,200,160,0.15)', borderless: false }}
                      style={({ pressed }) => [
                        pressed && Platform.OS === 'ios' ? { opacity: 0.7 } : undefined,
                        { marginRight: 8 },
                      ]}
                      className={`px-4 py-2 rounded-xl ${isSelected ? 'bg-primary' : 'bg-secondary'}`}
                    >
                      <Text
                        className={`text-sm font-bold ${
                          isSelected ? 'text-primary-foreground' : 'text-primary'
                        }`}
                      >
                        {hours}h
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* ── Appearance ─────────────────────────────────────────────────── */}
        <SectionHeader label="Appearance" />
        <View className="mx-4 bg-card rounded-2xl mb-6 overflow-hidden">
          {/* Theme selector */}
          <View className="px-4 py-4 border-b border-border">
            <Text className="text-muted-foreground text-xs mb-4">Theme</Text>
            <View className="flex-row">
              {THEME_OPTIONS.map((option) => {
                const isSelected = settings.theme === option.key;
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => handleThemePress(option)}
                    android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: true }}
                    style={({ pressed }) => [
                      pressed && Platform.OS === 'ios' ? { opacity: 0.7 } : undefined,
                      { flex: 1, alignItems: 'center' },
                    ]}
                  >
                    {/* Color circle */}
                    <View
                      style={[
                        {
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          backgroundColor: option.color,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: isSelected ? 3 : 0,
                          borderColor: '#FFFFFF',
                        },
                        Platform.OS === 'ios'
                          ? {
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.15,
                              shadowRadius: 3,
                            }
                          : { elevation: 2 },
                      ]}
                    >
                      {isSelected ? (
                        <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                      ) : !isThemeUnlocked(option) ? (
                        <Text style={{ fontSize: 10 }}>🔒</Text>
                      ) : null}
                    </View>
                    <Text className="text-muted-foreground text-xs mt-1.5">{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Avatar selector */}
          <View className="px-4 py-4">
            <View className="flex-row items-center mb-4">
              <Text className="text-muted-foreground text-xs flex-1">Avatar</Text>
              {!hasThemePack && (
                <>
                  <Text style={{ fontSize: 10 }}>🔒</Text>
                  <Text className="text-muted-foreground text-xs ml-1">Theme Pack</Text>
                </>
              )}
            </View>
            <View className="flex-row">
              {AVATAR_OPTIONS.map((option) => {
                const isAvatarSelected = hasThemePack && settings.avatar === option.key;
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => handleAvatarPress(option)}
                    android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: true }}
                    style={({ pressed }) => [
                      pressed && Platform.OS === 'ios' ? { opacity: 0.7 } : undefined,
                      { flex: 1, alignItems: 'center' },
                    ]}
                  >
                    <View
                      className={`w-11 h-11 rounded-full items-center justify-center ${
                        isAvatarSelected ? 'bg-primary' : 'bg-secondary'
                      }`}
                    >
                      <Ionicons
                        name={option.icon}
                        size={20}
                        color={isAvatarSelected ? '#FFFFFF' : hasThemePack ? themeColors.primary : '#9CA3AF'}
                      />
                    </View>
                    <Text className="text-muted-foreground text-xs mt-1.5">{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── More ───────────────────────────────────────────────────────── */}
        <SectionHeader label="More" />
        <View className="mx-4 bg-card rounded-2xl overflow-hidden">
          {/* Restore purchases */}
          <Pressable
            onPress={handleRestorePurchases}
            android_ripple={{ color: 'rgba(0,0,0,0.06)', borderless: false }}
            style={({ pressed }) => [
              pressed && Platform.OS === 'ios' ? { opacity: 0.7 } : undefined,
            ]}
            className="flex-row items-center px-4 py-4 border-b border-border"
          >
            <Text className="text-foreground text-base flex-1">Restore Purchases</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </Pressable>

          {/* App version */}
          <View className="flex-row items-center px-4 py-4">
            <Text className="text-muted-foreground text-base flex-1">Version</Text>
            <Text className="text-muted-foreground text-base">{APP_VERSION}</Text>
          </View>
        </View>

        {/* ── DEV Testing Panel — only in __DEV__ builds ──────────────── */}
        {__DEV__ && (
          <View className="mx-4 mt-6 mb-2">
            <Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-3 px-2">
              Dev Tools
            </Text>
            <View className="bg-card rounded-2xl overflow-hidden">
              {/* Theme switcher */}
              <View className="px-4 py-3 border-b border-border">
                <Text className="text-muted-foreground text-xs mb-2">Theme</Text>
                <View className="flex-row flex-wrap">
                  {THEME_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.key}
                      onPress={() => void updateSettings({ theme: opt.key })}
                      style={[
                        {
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 8,
                          marginRight: 6,
                          marginBottom: 4,
                          backgroundColor: opt.color,
                        },
                      ]}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>
                        {opt.label}
                        {settings.theme === opt.key ? ' ✓' : ''}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Avatar switcher */}
              <View className="px-4 py-3 border-b border-border">
                <Text className="text-muted-foreground text-xs mb-2">Avatar</Text>
                <View className="flex-row flex-wrap">
                  {AVATAR_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.key}
                      onPress={() => void updateSettings({ avatar: opt.key })}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 8,
                        marginRight: 6,
                        marginBottom: 4,
                        backgroundColor: settings.avatar === opt.key ? themeColors.primary : '#6B7280',
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* IAP toggles */}
              <View className="px-4 py-3 border-b border-border flex-row">
                <Pressable
                  onPress={devToggleThemePack}
                  style={{
                    flex: 1,
                    marginRight: 6,
                    paddingVertical: 7,
                    borderRadius: 8,
                    backgroundColor: hasThemePack ? '#4CAF50' : '#9CA3AF',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>
                    Theme Pack {hasThemePack ? 'ON' : 'OFF'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={devTogglePowerPack}
                  style={{
                    flex: 1,
                    paddingVertical: 7,
                    borderRadius: 8,
                    backgroundColor: hasPowerPack ? '#4CAF50' : '#9CA3AF',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>
                    Power Pack {hasPowerPack ? 'ON' : 'OFF'}
                  </Text>
                </Pressable>
              </View>

              {/* Reset all data */}
              <Pressable
                onPress={() => {
                  void (async () => {
                    await clearAllStorage();
                    router.replace('/onboarding/welcome');
                  })();
                }}
                style={{
                  paddingVertical: 10,
                  alignItems: 'center',
                  backgroundColor: '#FF3B30',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}>
                  Reset All Data → Onboarding
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}