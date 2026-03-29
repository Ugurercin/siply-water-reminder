import type { AppSettings, UserProfile } from '@/types';
import { scheduleHydrationReminders } from '@/utils/notifications';
import {
  readAppSettings,
  readUserProfile,
  writeAppSettings,
  writeUserProfile,
} from '@/utils/storage';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// --- Default Values -----------------------------------------------------------

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

// --- Context Type -------------------------------------------------------------

interface SettingsContextValue {
  profile: UserProfile;
  settings: AppSettings;
  isLoaded: boolean;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  resetAll: () => Promise<void>;
}

// --- Default context value (safe fallback before provider mounts) -------------

const DEFAULT_CONTEXT: SettingsContextValue = {
  profile: DEFAULT_PROFILE,
  settings: DEFAULT_SETTINGS,
  isLoaded: false,
  updateProfile: async () => {},
  updateSettings: async () => {},
  resetAll: async () => {},
};

// --- Context -----------------------------------------------------------------

const SettingsContext = createContext<SettingsContextValue>(DEFAULT_CONTEXT);

// --- Provider ----------------------------------------------------------------

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

// --- Consumer Hook -----------------------------------------------------------

// Returns safe defaults instead of throwing when called before provider mounts.
// Screens should check `isLoaded` before rendering real content.
export function useSettingsContext(): SettingsContextValue {
  return useContext(SettingsContext);
}