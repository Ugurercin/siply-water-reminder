import { StatCard } from '@/components/StatCard';
import { THEME_PALETTE } from '@/constants/themes';
import { useHistory } from '@/hooks/useHistory';
import { usePurchases } from '@/hooks/usePurchases';
import { useSettingsContext } from '@/context/SettingsContext';
import { fromDateKey, getLastNDayKeys } from '@/utils/dateHelpers';
import { formatVolume } from '@/utils/units';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import { Dimensions, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Constants ────────────────────────────────────────────────────────────────

const SCREEN_WIDTH = Dimensions.get('window').width;
// Account for mx-4 (16px × 2) + px-4 card padding (16px × 2)
const CHART_WIDTH = SCREEN_WIDTH - 64;

// ─── History Screen ───────────────────────────────────────────────────────────

export default function HistoryScreen(): React.JSX.Element {
  const { recentLogs, fullLogs, stats, isLoaded, refresh } = useHistory();
  const { profile, settings } = useSettingsContext();
  const { hasPowerPack } = usePurchases();

  // Reload whenever this tab gains focus
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const volumeUnit = settings.volumeUnit;
  const themeColors = THEME_PALETTE[settings.theme];
  const goalMl = profile.dailyGoalMl;

  const hasAnyData = recentLogs.some((l) => l !== null && l.totalMl > 0);

  // Build chart bars: oldest day first → newest (today) last
  const chartKeys = getLastNDayKeys(7).reverse();
  const chartLogsOldFirst = [...recentLogs].reverse();

  const maxIntake = recentLogs.reduce((max, l) => Math.max(max, l?.totalMl ?? 0), 0);
  const maxBarValue = Math.max(goalMl * 1.25, maxIntake);

  // 30-day chart data for Power Pack section (oldest → newest)
  const fullChartKeys = getLastNDayKeys(30).reverse();
  const fullLogsOldFirst = [...fullLogs].reverse();
  const fullBarData = fullChartKeys.map((key, index) => {
    const log = fullLogsOldFirst[index] ?? null;
    const date = fromDateKey(key);
    return {
      value: log?.totalMl ?? 0,
      label: String(date.getDate()),
      frontColor: log?.goalReached === true ? themeColors.primary : '#D1D5DB',
    };
  });

  const barData = chartKeys.map((key, index) => {
    const log = chartLogsOldFirst[index] ?? null;
    const date = fromDateKey(key);
    const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
    return {
      value: log?.totalMl ?? 0,
      label: dayLabel,
      frontColor: log?.goalReached === true ? themeColors.primary : '#D1D5DB',
    };
  });

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (!isLoaded) {
    return (
      <SafeAreaView className="bg-background" style={{ flex: 1 }} edges={['top', 'bottom']}>
        <StatusBar style="auto" />
      </SafeAreaView>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView className="bg-background" style={{ flex: 1 }} edges={['top', 'bottom']}>
      <StatusBar style="auto" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View className="px-6 pt-4 pb-2">
          <Text className="text-foreground text-2xl font-bold">History</Text>
          <Text className="text-muted-foreground text-sm">Your hydration over time</Text>
        </View>

        {hasAnyData ? (
          <>
            {/* ── Stats Row ──────────────────────────────────────────────── */}
            <View className="flex-row px-4 pt-4 pb-2">
              <StatCard
                emoji="🔥"
                label="Current Streak"
                value={`${stats.currentStreak} ${stats.currentStreak === 1 ? 'day' : 'days'}`}
              />
              <StatCard
                emoji="🏆"
                label="Best Streak"
                value={`${stats.longestStreak} ${stats.longestStreak === 1 ? 'day' : 'days'}`}
              />
              <StatCard
                emoji="💧"
                label="Daily Average"
                value={
                  stats.averageDailyMl > 0
                    ? formatVolume(stats.averageDailyMl, volumeUnit)
                    : '—'
                }
              />
            </View>

            {/* ── 7-Day Bar Chart ─────────────────────────────────────────── */}
            <View className="mx-4 mt-2">
              {/* Section header */}
              <View className="flex-row items-center justify-between mb-3 px-2">
                <Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  Last 7 Days
                </Text>
                {/* Legend */}
                <View className="flex-row items-center">
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      backgroundColor: themeColors.primary,
                      marginRight: 4,
                    }}
                  />
                  <Text className="text-muted-foreground text-xs mr-4">Goal reached</Text>
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      backgroundColor: '#D1D5DB',
                      marginRight: 4,
                    }}
                  />
                  <Text className="text-muted-foreground text-xs">Below goal</Text>
                </View>
              </View>

              {/* Chart card */}
              <View className="bg-card rounded-2xl px-4 pt-5 pb-4">
                <BarChart
                  data={barData}
                  barWidth={28}
                  spacing={Math.max(6, Math.floor((CHART_WIDTH - 7 * 28) / 7 - 4))}
                  barBorderRadius={5}
                  noOfSections={4}
                  maxValue={maxBarValue}
                  width={CHART_WIDTH}
                  height={160}
                  hideYAxisText
                  yAxisThickness={0}
                  xAxisThickness={0}
                  hideRules={false}
                  rulesColor="#F3F4F6"
                  rulesType="solid"
                  xAxisLabelTextStyle={{ color: '#9CA3AF', fontSize: 11 }}
                  isAnimated
                  animationDuration={500}
                  showReferenceLine1
                  referenceLine1Position={goalMl}
                  referenceLine1Config={{
                    color: themeColors.primary,
                    dashWidth: 5,
                    dashGap: 3,
                    thickness: 1.5,
                  }}
                />

                {/* Goal reference legend */}
                <View className="flex-row items-center mt-2 pl-1">
                  <View
                    style={{
                      width: 16,
                      height: 0,
                      borderTopWidth: 1.5,
                      borderColor: themeColors.primary,
                      borderStyle: 'dashed',
                      marginRight: 6,
                    }}
                  />
                  <Text className="text-muted-foreground text-xs">
                    Daily goal: {formatVolume(goalMl, volumeUnit)}
                  </Text>
                </View>
              </View>

              {/* Goal hit rate summary */}
              <View className="mt-3 bg-card rounded-2xl px-4 py-3 flex-row items-center justify-between">
                <Text className="text-muted-foreground text-sm">Goal hit rate (7 days)</Text>
                <Text className="text-foreground text-sm font-bold">
                  {Math.round(stats.goalHitRate * 100)}%
                </Text>
              </View>
            </View>

            {/* ── Full History — unlocked or locked ──────────────────────── */}
            <View className="mx-4 mt-4">
              {hasPowerPack ? (
                /* Unlocked: 30-day chart */
                <>
                  <View className="flex-row items-center justify-between mb-3 px-2">
                    <Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                      Last 30 Days
                    </Text>
                    <Text className="text-muted-foreground text-xs">scroll →</Text>
                  </View>

                  <View className="bg-card rounded-2xl px-4 pt-5 pb-4">
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      nestedScrollEnabled
                    >
                      <BarChart
                        data={fullBarData}
                        barWidth={10}
                        spacing={6}
                        barBorderRadius={2}
                        noOfSections={3}
                        maxValue={maxBarValue}
                        width={30 * 16}
                        height={120}
                        hideYAxisText
                        yAxisThickness={0}
                        xAxisThickness={0}
                        rulesColor="#F3F4F6"
                        xAxisLabelTextStyle={{ color: '#9CA3AF', fontSize: 8 }}
                        showReferenceLine1
                        referenceLine1Position={goalMl}
                        referenceLine1Config={{
                          color: themeColors.primary,
                          dashWidth: 4,
                          dashGap: 3,
                          thickness: 1,
                        }}
                      />
                    </ScrollView>
                    <View className="flex-row items-center mt-2 pl-1">
                      <View
                        style={{
                          width: 14,
                          height: 0,
                          borderTopWidth: 1.5,
                          borderColor: themeColors.primary,
                          borderStyle: 'dashed',
                          marginRight: 6,
                        }}
                      />
                      <Text className="text-muted-foreground text-xs">
                        Daily goal: {formatVolume(goalMl, volumeUnit)}
                      </Text>
                    </View>
                  </View>

                  <View className="mt-3 bg-card rounded-2xl px-4 py-3 flex-row items-center justify-between">
                    <Text className="text-muted-foreground text-sm">Goal hit rate (30 days)</Text>
                    <Text className="text-foreground text-sm font-bold">
                      {Math.round(stats.goalHitRate * 100)}%
                    </Text>
                  </View>
                </>
              ) : (
                /* Locked: paywall card */
                <Pressable
                  onPress={() => router.push('/modals/paywall')}
                  android_ripple={{ color: 'rgba(0,0,0,0.06)', borderless: false }}
                  style={({ pressed }) => [
                    pressed && Platform.OS === 'ios' ? { opacity: 0.8 } : undefined,
                  ]}
                >
                  <View className="bg-card rounded-2xl px-4 py-5">
                    <View className="flex-row items-center mb-4">
                      <View className="w-9 h-9 rounded-full bg-secondary items-center justify-center mr-3">
                        <Ionicons name="lock-closed" size={18} color="#9CA3AF" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-foreground text-base font-bold">Full History</Text>
                        <Text className="text-muted-foreground text-xs mt-0.5">
                          Power Pack · $1.99
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                    </View>

                    {([
                      '30+ days of detailed charts',
                      'Monthly view & trend analysis',
                      'Goal hit rate over time',
                      'CSV data export',
                    ] as const).map((feature) => (
                      <View key={feature} className="flex-row items-center mb-2.5">
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={16}
                          color="#9CA3AF"
                          style={{ marginRight: 8 }}
                        />
                        <Text className="text-muted-foreground text-sm">{feature}</Text>
                      </View>
                    ))}

                    <View className="mt-3 bg-secondary rounded-xl py-3 items-center">
                      <Text className="text-primary text-sm font-bold">Unlock Power Pack</Text>
                    </View>
                  </View>
                </Pressable>
              )}
            </View>
          </>
        ) : (
          /* ── Empty state ─────────────────────────────────────────────────── */
          <View className="items-center px-8 pt-20">
            <Ionicons name="analytics-outline" size={64} color="#D1D5DB" />
            <Text className="text-foreground text-xl font-bold text-center mt-4">
              No history yet
            </Text>
            <Text className="text-muted-foreground text-sm text-center mt-2 leading-5">
              Log drinks on the Home tab and your progress will show up here.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
