import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';

import { useSettings } from '@/hooks/useSettings';
import { useWaterStore } from '@/hooks/useWaterStore';
import type { DrinkType, VolumeUnit } from '@/types';
import { DRINK_TYPES } from '@/types';
import { displayToMl, formatVolume, getPresetAmounts } from '@/utils/units';
import { THEME_PALETTE } from '@/constants/themes';

// ─── Types ────────────────────────────────────────────────────────────────────

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface DrinkTypeConfig {
  type: DrinkType;
  label: string;
  icon: IoniconsName;
  free: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DRINK_TYPE_CONFIG: DrinkTypeConfig[] = [
  { type: DRINK_TYPES.WATER, label: 'Water', icon: 'water-outline', free: true },
  { type: DRINK_TYPES.COFFEE, label: 'Coffee', icon: 'cafe-outline', free: false },
  { type: DRINK_TYPES.TEA, label: 'Tea', icon: 'leaf-outline', free: false },
  { type: DRINK_TYPES.JUICE, label: 'Juice', icon: 'nutrition-outline', free: false },
  { type: DRINK_TYPES.SPORTS, label: 'Sports', icon: 'fitness-outline', free: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a preset value (already in the user's display unit) for button labels. */
function formatPresetLabel(value: number, unit: VolumeUnit): string {
  switch (unit) {
    case 'ml':
      return `${value} ml`;
    case 'oz':
      return `${value} oz`;
    case 'cups':
      return `${value} ${value === 1 ? 'cup' : 'cups'}`;
  }
}

/**
 * Derive the amount in ml from the current selection state.
 * Returns null if no valid amount is selected/entered.
 */
function resolveAmountMl(
  isCustomMode: boolean,
  selectedPresetIndex: number | null,
  customAmountText: string,
  presets: number[],
  volumeUnit: VolumeUnit,
): number | null {
  if (!isCustomMode) {
    if (selectedPresetIndex === null) return null;
    const presetValue = presets[selectedPresetIndex];
    if (presetValue === undefined) return null;
    return displayToMl(presetValue, volumeUnit);
  }
  // Custom mode: parse the text input
  const normalized = customAmountText.trim().replace(',', '.');
  const parsed = parseFloat(normalized);
  if (!isFinite(parsed) || parsed <= 0) return null;
  return displayToMl(parsed, volumeUnit);
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export default function LogDrinkModal(): React.JSX.Element {
  const { profile, settings } = useSettings();
  const { addDrink } = useWaterStore(profile.dailyGoalMl);

  const volumeUnit = settings.volumeUnit;
  const themeColors = THEME_PALETTE[settings.theme];
  const presets = getPresetAmounts(volumeUnit);

  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedDrinkType, setSelectedDrinkType] = useState<DrinkType>(DRINK_TYPES.WATER);
  // Default to the second preset (index 1 → 250 ml / 8 oz / 1 cup)
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number | null>(1);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customAmountText, setCustomAmountText] = useState('');

  const inputRef = useRef<TextInput>(null);

  // ── Derived values ─────────────────────────────────────────────────────────
  const amountMl = resolveAmountMl(
    isCustomMode,
    selectedPresetIndex,
    customAmountText,
    presets,
    volumeUnit,
  );
  const canConfirm = amountMl !== null && amountMl > 0;

  const confirmLabel =
    canConfirm && amountMl !== null
      ? `Add ${formatVolume(amountMl, volumeUnit)}`
      : 'Select an amount';

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleDrinkTypePress(config: DrinkTypeConfig): void {
    if (!config.free) {
      // Locked — take user to the Power Pack paywall
      router.push('/modals/paywall');
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDrinkType(config.type);
  }

  function handlePresetPress(index: number): void {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsCustomMode(false);
    setSelectedPresetIndex(index);
    setCustomAmountText('');
  }

  function handleCustomPress(): void {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsCustomMode(true);
    setSelectedPresetIndex(null);
    // Slight delay so the input renders before focusing
    setTimeout(() => {
      inputRef.current?.focus();
    }, 80);
  }

  async function handleConfirm(): Promise<void> {
    if (amountMl === null || amountMl <= 0) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addDrink(selectedDrinkType, amountMl);
    router.back();
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.select({ ios: 'padding', android: 'height' })}
    >
      <StatusBar style="auto" />
      <SafeAreaView className="flex-1" edges={['bottom']}>

        {/* Handle bar — visual cue that this is a bottom sheet */}
        <View className="items-center pt-3 pb-1">
          <View className="w-10 h-1 rounded-full bg-border" />
        </View>

        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <Text className="text-foreground text-xl font-bold">Log a Drink</Text>
          <Pressable
            onPress={() => router.back()}
            android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: true }}
            style={({ pressed }) => [
              pressed && Platform.OS === 'ios' ? { opacity: 0.6 } : undefined,
            ]}
            hitSlop={10}
          >
            <Ionicons name="close" size={24} color="#9CA3AF" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Drink Type ─────────────────────────────────────────────── */}
          <Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-3">
            Drink Type
          </Text>

          <View className="flex-row mb-7">
            {DRINK_TYPE_CONFIG.map((config) => {
              const isSelected = config.free && config.type === selectedDrinkType;
              return (
                <Pressable
                  key={config.type}
                  onPress={() => handleDrinkTypePress(config)}
                  android_ripple={{ color: 'rgba(45, 200, 160, 0.15)', borderless: false }}
                  style={({ pressed }) => [
                    pressed && Platform.OS === 'ios' ? { opacity: 0.7 } : undefined,
                    { flex: 1, marginHorizontal: 2 },
                  ]}
                  className={`items-center py-3.5 rounded-xl ${
                    isSelected ? 'bg-primary' : 'bg-secondary'
                  }`}
                >
                  {/* Icon with lock badge for locked types */}
                  <View style={{ position: 'relative', width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons
                      name={config.icon}
                      size={22}
                      color={isSelected ? '#FFFFFF' : themeColors.primary}
                    />
                    {!config.free && (
                      <View style={{ position: 'absolute', top: -4, right: -6 }}>
                        <Text style={{ fontSize: 9 }}>🔒</Text>
                      </View>
                    )}
                  </View>
                  <Text
                    className={`text-xs mt-1.5 font-bold ${
                      isSelected ? 'text-primary-foreground' : 'text-primary'
                    }`}
                    numberOfLines={1}
                  >
                    {config.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Amount ─────────────────────────────────────────────────── */}
          <Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-3">
            Amount
          </Text>

          {/* 2×2 preset grid */}
          <View className="flex-row flex-wrap mb-3">
            {presets.map((preset, index) => {
              const isSelected = !isCustomMode && selectedPresetIndex === index;
              // Even-index items get right margin; odd-index don't
              const marginRight = index % 2 === 0 ? 6 : 0;
              return (
                <Pressable
                  key={index}
                  onPress={() => handlePresetPress(index)}
                  android_ripple={{ color: 'rgba(45, 200, 160, 0.15)', borderless: false }}
                  style={({ pressed }) => [
                    pressed && Platform.OS === 'ios' ? { opacity: 0.7 } : undefined,
                    {
                      width: '48%',
                      marginRight,
                      marginBottom: 8,
                    },
                  ]}
                  className={`items-center py-4 rounded-xl ${
                    isSelected ? 'bg-primary' : 'bg-secondary'
                  }`}
                >
                  <Text
                    className={`text-base font-bold ${
                      isSelected ? 'text-primary-foreground' : 'text-primary'
                    }`}
                  >
                    {formatPresetLabel(preset, volumeUnit)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Custom amount toggle */}
          <Pressable
            onPress={handleCustomPress}
            android_ripple={{ color: 'rgba(45, 200, 160, 0.15)', borderless: false }}
            style={({ pressed }) => [
              pressed && Platform.OS === 'ios' ? { opacity: 0.7 } : undefined,
            ]}
            className={`py-4 rounded-xl items-center mb-3 ${
              isCustomMode ? 'bg-primary' : 'bg-secondary'
            }`}
          >
            <Text
              className={`text-base font-bold ${
                isCustomMode ? 'text-primary-foreground' : 'text-primary'
              }`}
            >
              Custom amount
            </Text>
          </Pressable>

          {/* Custom text input — only visible in custom mode */}
          {isCustomMode && (
            <View className="flex-row items-center bg-secondary rounded-xl px-4 mb-4">
              <TextInput
                ref={inputRef}
                value={customAmountText}
                onChangeText={setCustomAmountText}
                placeholder={`Enter amount in ${volumeUnit}`}
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={() => void handleConfirm()}
                className="flex-1 text-foreground text-base py-3.5"
                style={
                  Platform.OS === 'android' ? { includeFontPadding: false } : undefined
                }
              />
              <Text className="text-muted-foreground text-base ml-2 font-bold">
                {volumeUnit}
              </Text>
            </View>
          )}

          {/* Bottom padding so content clears the confirm button */}
          <View style={{ height: 8 }} />
        </ScrollView>

        {/* ── Confirm button — fixed at the bottom ───────────────────── */}
        <View className="px-6 pt-2 pb-2">
          <Pressable
            onPress={() => void handleConfirm()}
            disabled={!canConfirm}
            android_ripple={{ color: 'rgba(255,255,255,0.25)', borderless: false }}
            style={({ pressed }) => [
              pressed && Platform.OS === 'ios' && canConfirm ? { opacity: 0.85 } : undefined,
            ]}
            className={`py-4 rounded-2xl items-center ${
              canConfirm ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <Text
              className={`text-base font-bold ${
                canConfirm ? 'text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              {confirmLabel}
            </Text>
          </Pressable>
        </View>

      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
