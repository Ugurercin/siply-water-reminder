import { useState, useEffect, useCallback } from 'react';
import type { DayLog } from '@/types';
import { readDayLogs } from '@/utils/storage';
import { getLastNDayKeys, calculateStreak, todayKey } from '@/utils/dateHelpers';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HistoryStats {
  currentStreak: number;
  longestStreak: number;
  averageDailyMl: number;
  goalHitRate: number; // 0–1
}

interface UseHistoryReturn {
  recentLogs: (DayLog | null)[];   // last 7 days (free tier)
  fullLogs: (DayLog | null)[];     // last 30 days (Power Pack)
  stats: HistoryStats;
  isLoaded: boolean;
  refresh: () => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeStats(logs: (DayLog | null)[]): HistoryStats {
  const present = logs.filter((l): l is DayLog => l !== null);

  if (present.length === 0) {
    return { currentStreak: 0, longestStreak: 0, averageDailyMl: 0, goalHitRate: 0 };
  }

  const averageDailyMl = present.reduce((s, l) => s + l.totalMl, 0) / present.length;
  const goalHitRate = present.filter((l) => l.goalReached).length / present.length;

  // Streak: walk backwards from yesterday (today is excluded from penalty)
  const today = todayKey();
  const pastLogs = present
    .filter((l) => l.date !== today)
    .sort((a, b) => (a.date > b.date ? -1 : 1)); // most-recent first

  const currentStreak = calculateStreak(
    pastLogs.map((l) => ({ dateKey: l.date, goalReached: l.goalReached }))
  );

  // Longest streak: sliding window
  const sorted = [...present].sort((a, b) => (a.date < b.date ? -1 : 1));
  let longest = 0;
  let run = 0;
  for (const log of sorted) {
    if (log.date === today) continue;
    if (log.goalReached) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }

  return { currentStreak, longestStreak: longest, averageDailyMl, goalHitRate };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const FREE_DAYS = 7;
const FULL_DAYS = 30;

export function useHistory(): UseHistoryReturn {
  const [recentLogs, setRecentLogs] = useState<(DayLog | null)[]>([]);
  const [fullLogs, setFullLogs] = useState<(DayLog | null)[]>([]);
  const [stats, setStats] = useState<HistoryStats>({
    currentStreak: 0,
    longestStreak: 0,
    averageDailyMl: 0,
    goalHitRate: 0,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(async (): Promise<void> => {
    const fullKeys = getLastNDayKeys(FULL_DAYS);
    const recentKeys = fullKeys.slice(0, FREE_DAYS);

    const [full, recent] = await Promise.all([
      readDayLogs(fullKeys),
      readDayLogs(recentKeys),
    ]);

    setFullLogs(full);
    setRecentLogs(recent);
    setStats(computeStats(full));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { recentLogs, fullLogs, stats, isLoaded, refresh };
}
