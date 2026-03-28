import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { AppSettings, UserProfile } from '@/types';
import { scheduleHydrationReminders } from '@/utils/notifications';
import {
  readAppSettings,
  readUserProfile,
  writeAppSettings,
  writeUserProfile,
} from '@/utils/storage';

// ─── Default Values ───────────────────────────────────────────────────────────

const DEFAULT_PROFILE: UserProfile = {
  weightKg: 70,
  activityLevel: 'medium',
  dailyGoalMl: 2300,
  onboardingComplete: false,
};

const DEFAULT_SETTINGS: AppSettings = {
  volumeUnit: 'ml',
  weightUnit: 'kg',
  reminderEnabled: true,
  reminderIntervalHours: 2,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  theme: 'ocean',
  avatar: 'drop',
};

// ─── Context Type ─────────────────────────────────────────────────────────────

interface SettingsContextValue {
  profile: UserProfile;
  settings: AppSettings;
  isLoaded: boolean;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  resetAll: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const SettingsContext = createContext<SettingsContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SettingsProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from storage once on mount
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [storedProfile, storedSettings] = await Promise.all([
        readUserProfile(),
        readAppSettings(),
      ]);
      if (!cancelled) {
        if (storedProfile !== null) setProfile(storedProfile);
        if (storedSettings !== null) setSettings(storedSettings);
        setIsLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateProfile = useCallback(async (patch: Partial<UserProfile>): Promise<void> => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      void writeUserProfile(next);
      return next;
    });
  }, []);

  const updateSettings = useCallback(async (patch: Partial<AppSettings>): Promise<void> => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      void writeAppSettings(next);
      void scheduleHydrationReminders(next);
      return next;
    });
  }, []);

  const resetAll = useCallback(async (): Promise<void> => {
    setProfile(DEFAULT_PROFILE);
    setSettings(DEFAULT_SETTINGS);
    await Promise.all([
      writeUserProfile(DEFAULT_PROFILE),
      writeAppSettings(DEFAULT_SETTINGS),
    ]);
  }, []);

  return (
    <SettingsContext.Provider value={{ profile, settings, isLoaded, updateProfile, updateSettings, resetAll }}>
      {children}
    </SettingsContext.Provider>
  );
}

// ─── Consumer Hook ────────────────────────────────────────────────────────────

export function useSettingsContext(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (ctx === null) {
    throw new Error('useSettingsContext must be used inside <SettingsProvider>');
  }
  return ctx;
}
