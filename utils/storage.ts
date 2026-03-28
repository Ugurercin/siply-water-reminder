import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile, AppSettings, DayLog } from '@/types';

// ─── Storage Keys ─────────────────────────────────────────────────────────────
// All keys are constants — never use inline strings elsewhere in the codebase.

export const STORAGE_KEYS = {
  USER_PROFILE: '@siply/user_profile',
  APP_SETTINGS: '@siply/app_settings',
  DAY_LOG_PREFIX: '@siply/day_log_', // append 'YYYY-MM-DD'
} as const;

// ─── Typed Value Map ──────────────────────────────────────────────────────────

interface StorageValueMap {
  [STORAGE_KEYS.USER_PROFILE]: UserProfile;
  [STORAGE_KEYS.APP_SETTINGS]: AppSettings;
}

// ─── Generic Helpers ──────────────────────────────────────────────────────────

/**
 * Read a JSON value from AsyncStorage and parse it into type T.
 * Returns null if the key doesn't exist or the value can't be parsed.
 */
export async function readStorage<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Serialize and write a value to AsyncStorage.
 */
export async function writeStorage<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

/**
 * Remove a key from AsyncStorage.
 */
export async function deleteStorage(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

// ─── Typed Helpers for Known Keys ────────────────────────────────────────────

export async function readUserProfile(): Promise<UserProfile | null> {
  return readStorage<UserProfile>(STORAGE_KEYS.USER_PROFILE);
}

export async function writeUserProfile(profile: UserProfile): Promise<void> {
  return writeStorage(STORAGE_KEYS.USER_PROFILE, profile);
}

export async function readAppSettings(): Promise<AppSettings | null> {
  return readStorage<AppSettings>(STORAGE_KEYS.APP_SETTINGS);
}

export async function writeAppSettings(settings: AppSettings): Promise<void> {
  return writeStorage(STORAGE_KEYS.APP_SETTINGS, settings);
}

export async function readDayLog(dateKey: string): Promise<DayLog | null> {
  return readStorage<DayLog>(`${STORAGE_KEYS.DAY_LOG_PREFIX}${dateKey}`);
}

export async function writeDayLog(dateKey: string, log: DayLog): Promise<void> {
  return writeStorage(`${STORAGE_KEYS.DAY_LOG_PREFIX}${dateKey}`, log);
}

/**
 * Read multiple day logs for a list of date keys (e.g. last 7 or 30 days).
 * Missing days are returned as null entries in the resulting array.
 */
export async function readDayLogs(dateKeys: string[]): Promise<(DayLog | null)[]> {
  return Promise.all(dateKeys.map((key) => readDayLog(key)));
}

/**
 * Wipe every key in AsyncStorage. DEV-only utility — do not call in production.
 * Clears all Siply data including user profile, settings, and every day log.
 */
export async function clearAllStorage(): Promise<void> {
  await AsyncStorage.clear();
}

// Unused generic typed helper kept for future use
export type { StorageValueMap };
