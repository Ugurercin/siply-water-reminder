import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import type { DayLog, DrinkEntry, DrinkType } from '@/types';
import { DRINK_TYPES } from '@/types';
import { readDayLog, writeDayLog } from '@/utils/storage';
import { todayKey } from '@/utils/dateHelpers';

// ─── Hydration Multipliers ────────────────────────────────────────────────────

const HYDRATION_MULTIPLIERS: Record<DrinkType, number> = {
  [DRINK_TYPES.WATER]: 1.0,
  [DRINK_TYPES.COFFEE]: 0.6,
  [DRINK_TYPES.TEA]: 0.8,
  [DRINK_TYPES.JUICE]: 0.85,
  [DRINK_TYPES.SPORTS]: 0.9,
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildEmptyLog(dateKey: string, goalMl: number): DayLog {
  return {
    date: dateKey,
    entries: [],
    totalMl: 0,
    goalMl,
    goalReached: false,
  };
}

function recalcLog(log: DayLog): DayLog {
  const totalMl = log.entries.reduce((sum, e) => sum + e.hydratingMl, 0);
  return { ...log, totalMl, goalReached: totalMl >= log.goalMl };
}

// ─── Hook Return Type ─────────────────────────────────────────────────────────

interface UseWaterStoreReturn {
  todayLog: DayLog | null;
  isLoaded: boolean;
  addDrink: (drinkType: DrinkType, amountMl: number) => Promise<void>;
  removeDrink: (entryId: string) => Promise<void>;
  setGoal: (goalMl: number) => Promise<void>;
  /** Re-read today's log from storage. Call this when returning from a modal
   *  that may have written a new entry via a separate hook instance. */
  refresh: () => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWaterStore(dailyGoalMl: number): UseWaterStoreReturn {
  const [todayLog, setTodayLog] = useState<DayLog | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const currentDateKey = useRef(todayKey());

  // Load today's log from storage
  const loadToday = useCallback(async (): Promise<void> => {
    const key = todayKey();
    currentDateKey.current = key;
    const stored = await readDayLog(key);
    if (stored !== null) {
      setTodayLog(stored);
    } else {
      const fresh = buildEmptyLog(key, dailyGoalMl);
      setTodayLog(fresh);
      await writeDayLog(key, fresh);
    }
    setIsLoaded(true);
  }, [dailyGoalMl]);

  useEffect(() => {
    void loadToday();
  }, [loadToday]);

  // Reset at midnight: detect day change when the app comes to the foreground
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'active') {
          const newKey = todayKey();
          if (newKey !== currentDateKey.current) {
            void loadToday();
          }
        }
      }
    );
    return () => subscription.remove();
  }, [loadToday]);

  // ─── Mutators ───────────────────────────────────────────────────────────────

  const addDrink = useCallback(
    async (drinkType: DrinkType, amountMl: number): Promise<void> => {
      const key = currentDateKey.current;
      const multiplier = HYDRATION_MULTIPLIERS[drinkType];
      const entry: DrinkEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString(),
        drinkType,
        amountMl,
        hydratingMl: amountMl * multiplier,
      };

      setTodayLog((prev) => {
        const base = prev ?? buildEmptyLog(key, dailyGoalMl);
        const updated = recalcLog({ ...base, entries: [...base.entries, entry] });
        void writeDayLog(key, updated);
        return updated;
      });
    },
    [dailyGoalMl]
  );

  const removeDrink = useCallback(async (entryId: string): Promise<void> => {
    const key = currentDateKey.current;
    setTodayLog((prev) => {
      if (prev === null) return null;
      const updated = recalcLog({
        ...prev,
        entries: prev.entries.filter((e) => e.id !== entryId),
      });
      void writeDayLog(key, updated);
      return updated;
    });
  }, []);

  const setGoal = useCallback(async (goalMl: number): Promise<void> => {
    const key = currentDateKey.current;
    setTodayLog((prev) => {
      const base = prev ?? buildEmptyLog(key, goalMl);
      const updated = recalcLog({ ...base, goalMl });
      void writeDayLog(key, updated);
      return updated;
    });
  }, []);

  return { todayLog, isLoaded, addDrink, removeDrink, setGoal, refresh: loadToday };
}
