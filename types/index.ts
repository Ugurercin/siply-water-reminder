// ─── Volume & Weight Units ────────────────────────────────────────────────────

export const VOLUME_UNITS = { ML: 'ml', OZ: 'oz', CUPS: 'cups' } as const;
export type VolumeUnit = (typeof VOLUME_UNITS)[keyof typeof VOLUME_UNITS];

export const WEIGHT_UNITS = { KG: 'kg', LBS: 'lbs' } as const;
export type WeightUnit = (typeof WEIGHT_UNITS)[keyof typeof WEIGHT_UNITS];

// ─── Activity Level ───────────────────────────────────────────────────────────

export const ACTIVITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[keyof typeof ACTIVITY_LEVELS];

// ─── Drink Types ──────────────────────────────────────────────────────────────

export const DRINK_TYPES = {
  WATER: 'water',
  COFFEE: 'coffee',
  TEA: 'tea',
  JUICE: 'juice',
  SPORTS: 'sports',
} as const;
export type DrinkType = (typeof DRINK_TYPES)[keyof typeof DRINK_TYPES];

// ─── Themes & Avatars ─────────────────────────────────────────────────────────

export const THEMES = {
  OCEAN: 'ocean',
  FOREST: 'forest',
  SUNSET: 'sunset',
  MIDNIGHT: 'midnight',
} as const;
export type Theme = (typeof THEMES)[keyof typeof THEMES];

export const AVATARS = {
  DROP: 'drop',
  BOTTLE: 'bottle',
  CUP: 'cup',
  CAT: 'cat',
} as const;
export type Avatar = (typeof AVATARS)[keyof typeof AVATARS];

// ─── Data Interfaces ──────────────────────────────────────────────────────────

export interface UserProfile {
  weightKg: number;
  activityLevel: ActivityLevel;
  dailyGoalMl: number;
  onboardingComplete: boolean;
}

export interface DrinkEntry {
  id: string;
  timestamp: string;
  drinkType: DrinkType;
  amountMl: number;
  hydratingMl: number;
}

export interface DayLog {
  date: string;
  entries: DrinkEntry[];
  totalMl: number;
  goalMl: number;
  goalReached: boolean;
}

export interface AppSettings {
  volumeUnit: VolumeUnit;
  weightUnit: WeightUnit;
  reminderEnabled: boolean;
  reminderIntervalHours: number;
  quietHoursStart: string;
  quietHoursEnd: string;
  theme: Theme;
  avatar: Avatar;
}
