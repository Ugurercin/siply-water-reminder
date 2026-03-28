import type { ActivityLevel, VolumeUnit, WeightUnit } from '@/types';
import { ACTIVITY_LEVELS, AVATARS, THEMES, VOLUME_UNITS, WEIGHT_UNITS } from '@/types';
import { calculateDailyGoalMl } from '@/utils/goalCalculator';
import { writeAppSettings, writeUserProfile } from '@/utils/storage';
import { displayToKg, formatVolume, formatWeight, kgToDisplay } from '@/utils/units';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Step Definitions ─────────────────────────────────────────────────────────

const TOTAL_STEPS = 4;

// ─── Option Button ────────────────────────────────────────────────────────────

interface OptionButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function OptionButton({ label, selected, onPress }: OptionButtonProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(0,0,0,0.06)', borderless: false }}
      className={`flex-1 py-3 rounded-xl border-2 items-center ${
        selected ? 'border-primary bg-primary/10' : 'border-border bg-card'
      }`}
      style={({ pressed }) => [pressed && { opacity: 0.8 }]}
    >
      <Text
        className={`text-sm font-bold ${selected ? 'text-primary' : 'text-muted-foreground'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Activity Card ────────────────────────────────────────────────────────────

interface ActivityOption {
  level: ActivityLevel;
  label: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

const ACTIVITY_OPTIONS: ActivityOption[] = [
  {
    level: ACTIVITY_LEVELS.LOW,
    label: 'Sedentary',
    subtitle: 'Little or no exercise',
    icon: 'bed-outline',
  },
  {
    level: ACTIVITY_LEVELS.MEDIUM,
    label: 'Active',
    subtitle: 'Exercise 3–5 days/week',
    icon: 'walk-outline',
  },
  {
    level: ACTIVITY_LEVELS.HIGH,
    label: 'Very Active',
    subtitle: 'Daily intense exercise',
    icon: 'barbell-outline',
  },
];

interface ActivityCardProps {
  option: ActivityOption;
  selected: boolean;
  onPress: () => void;
}

function ActivityCard({ option, selected, onPress }: ActivityCardProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(0,0,0,0.06)', borderless: false }}
      className={`flex-row items-center p-4 rounded-2xl border-2 mb-3 ${
        selected ? 'border-primary bg-primary/10' : 'border-border bg-card'
      }`}
      style={({ pressed }) => [pressed && { opacity: 0.8 }]}
    >
      <View
        className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
          selected ? 'bg-primary' : 'bg-muted'
        }`}
      >
        <Ionicons
          name={option.icon}
          size={22}
          color={selected ? '#FFFFFF' : '#9CA3AF'}
        />
      </View>
      <View className="flex-1">
        <Text
          className={`text-base font-bold ${
            selected ? 'text-primary' : 'text-foreground'
          }`}
        >
          {option.label}
        </Text>
        <Text className="text-muted-foreground text-sm mt-0.5">{option.subtitle}</Text>
      </View>
      {selected && (
        <Ionicons name="checkmark-circle" size={22} color="#2DC8A0" />
      )}
    </Pressable>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

interface ProgressBarProps {
  step: number;
  total: number;
}

function ProgressBar({ step, total }: ProgressBarProps): React.JSX.Element {
  return (
    <View className="flex-row gap-1.5 px-6 pt-4">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className={`flex-1 h-1 rounded-full ${i < step ? 'bg-primary' : 'bg-border'}`}
        />
      ))}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen(): React.JSX.Element {
  const [step, setStep] = useState(1);
  const [volumeUnit, setVolumeUnit] = useState<VolumeUnit>(VOLUME_UNITS.ML);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(WEIGHT_UNITS.KG);
  const [weightInput, setWeightInput] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(ACTIVITY_LEVELS.MEDIUM);
  const [isSaving, setIsSaving] = useState(false);

  const weightKg = useMemo(() => {
    const val = parseFloat(weightInput);
    if (isNaN(val) || val <= 0) return 0;
    return displayToKg(val, weightUnit);
  }, [weightInput, weightUnit]);

  const dailyGoalMl = useMemo(() => {
    if (weightKg <= 0) return 0;
    return calculateDailyGoalMl({ weight: weightKg, weightUnit: 'kg', activityLevel });
  }, [weightKg, activityLevel]);

  const isWeightValid = weightKg >= 20 && weightKg <= 300;

  const handleBack = (): void => {
    if (step > 1) setStep((s) => s - 1);
    else router.back();
  };

  const handleNext = (): void => {
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  };

  const handleFinish = async (): Promise<void> => {
    if (isSaving) return;
    setIsSaving(true);
    await Promise.all([
      writeUserProfile({
        weightKg,
        activityLevel,
        dailyGoalMl,
        onboardingComplete: false, // set to true after notifications step
      }),
      writeAppSettings({
        volumeUnit,
        weightUnit,
        reminderEnabled: true,
        reminderIntervalHours: 2,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
        theme: THEMES.OCEAN,
        avatar: AVATARS.DROP,
      }),
    ]);
    setIsSaving(false);
    router.push('/onboarding/notifications');
  };

  // Weight display default when switching units
  const handleWeightUnitChange = (unit: WeightUnit): void => {
    if (weightKg > 0) {
      const displayed = kgToDisplay(weightKg, unit);
      setWeightInput(displayed.toFixed(1));
    }
    setWeightUnit(unit);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center px-4 pt-2">
        <Pressable
          onPress={handleBack}
          android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: true }}
          className="p-2 rounded-full"
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </Pressable>
      </View>

      <ProgressBar step={step} total={TOTAL_STEPS} />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.select({ ios: 'padding', android: 'height' })}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 pt-8 pb-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Step 1: Unit Preferences ── */}
          {step === 1 && (
            <Animated.View entering={FadeInRight.duration(300)}>
              <Text className="text-foreground text-3xl font-bold mb-2">Your Preferences</Text>
              <Text className="text-muted-foreground text-base mb-8">
                Choose the units you're comfortable with.
              </Text>

              <Text className="text-foreground text-sm font-bold uppercase tracking-wide mb-3">
                Volume
              </Text>
              <View className="flex-row gap-3 mb-8">
                {([VOLUME_UNITS.ML, VOLUME_UNITS.OZ, VOLUME_UNITS.CUPS] as VolumeUnit[]).map(
                  (unit) => (
                    <OptionButton
                      key={unit}
                      label={unit}
                      selected={volumeUnit === unit}
                      onPress={() => setVolumeUnit(unit)}
                    />
                  )
                )}
              </View>

              <Text className="text-foreground text-sm font-bold uppercase tracking-wide mb-3">
                Weight
              </Text>
              <View className="flex-row gap-3">
                {([WEIGHT_UNITS.KG, WEIGHT_UNITS.LBS] as WeightUnit[]).map((unit) => (
                  <OptionButton
                    key={unit}
                    label={unit}
                    selected={weightUnit === unit}
                    onPress={() => handleWeightUnitChange(unit)}
                  />
                ))}
              </View>
            </Animated.View>
          )}

          {/* ── Step 2: Weight Input ── */}
          {step === 2 && (
            <Animated.View entering={FadeInRight.duration(300)}>
              <Text className="text-foreground text-3xl font-bold mb-2">Your Weight</Text>
              <Text className="text-muted-foreground text-base mb-8">
                Used to calculate your ideal daily water intake.
              </Text>

              <View className="flex-row items-center bg-card border-2 border-border rounded-2xl px-4 py-3 mb-3">
                <TextInput
                  className="flex-1 text-foreground text-4xl font-bold"
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                  value={weightInput}
                  onChangeText={setWeightInput}
                  maxLength={6}
                  autoFocus
                />
                <Text className="text-muted-foreground text-xl font-bold ml-2">
                  {weightUnit}
                </Text>
              </View>

              {weightInput.length > 0 && !isWeightValid && (
                <Text className="text-destructive text-sm mt-2">
                  Please enter a valid weight
                  {weightUnit === 'kg' ? ' (20–300 kg)' : ' (44–660 lbs)'}
                </Text>
              )}
            </Animated.View>
          )}

          {/* ── Step 3: Activity Level ── */}
          {step === 3 && (
            <Animated.View entering={FadeInRight.duration(300)}>
              <Text className="text-foreground text-3xl font-bold mb-2">Activity Level</Text>
              <Text className="text-muted-foreground text-base mb-8">
                More active means you need more water.
              </Text>

              {ACTIVITY_OPTIONS.map((option) => (
                <ActivityCard
                  key={option.level}
                  option={option}
                  selected={activityLevel === option.level}
                  onPress={() => setActivityLevel(option.level)}
                />
              ))}
            </Animated.View>
          )}

          {/* ── Step 4: Goal Review ── */}
          {step === 4 && (
            <Animated.View entering={FadeInRight.duration(300)} className="items-center">
              <Text className="text-foreground text-3xl font-bold mb-2 text-center">
                Your Daily Goal
              </Text>
              <Text className="text-muted-foreground text-base mb-10 text-center">
                Based on your profile, here's your recommended intake.
              </Text>

              <View className="w-48 h-48 rounded-full bg-primary/10 border-4 border-primary items-center justify-center mb-6">
                <Text className="text-primary text-4xl font-bold">
                  {dailyGoalMl > 0
                    ? formatVolume(dailyGoalMl, volumeUnit)
                        .replace(' ml', '')
                        .replace(' oz', '')
                        .replace(' cups', '')
                    : '—'}
                </Text>
                <Text className="text-primary text-lg font-bold">{volumeUnit}</Text>
                <Text className="text-muted-foreground text-xs mt-1">per day</Text>
              </View>

              <View className="w-full bg-card rounded-2xl p-4 gap-3">
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Weight</Text>
                  <Text className="text-foreground font-bold">
                    {formatWeight(weightKg, weightUnit)}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Activity</Text>
                  <Text className="text-foreground font-bold capitalize">{activityLevel}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Goal</Text>
                  <Text className="text-foreground font-bold">
                    {dailyGoalMl > 0 ? formatVolume(dailyGoalMl, volumeUnit) : '—'}
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}
        </ScrollView>

        {/* CTA Button */}
        <View className="px-6 pb-4">
          <Pressable
            onPress={step === TOTAL_STEPS ? handleFinish : handleNext}
            disabled={
              (step === 2 && !isWeightValid) ||
              (step === TOTAL_STEPS && isSaving)
            }
            android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: false }}
            className={`rounded-2xl py-4 items-center ${
              (step === 2 && !isWeightValid) || (step === TOTAL_STEPS && isSaving)
                ? 'bg-primary/40'
                : 'bg-primary'
            }`}
            style={({ pressed }) => [pressed && { opacity: 0.85 }]}
          >
            <Text className="text-primary-foreground text-base font-bold">
              {step === TOTAL_STEPS ? 'Set Up Reminders' : 'Continue'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
