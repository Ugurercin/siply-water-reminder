// ─────────────────────────────────────────────
// EDIT THIS FILE to customize or add themes.
// Each theme is fully self-contained.
// Colors are plain hex values — easy to edit.
// ─────────────────────────────────────────────

export type ThemeKey = 'ocean' | 'forest' | 'sunset' | 'midnight';

export interface AppTheme {
  key: ThemeKey;
  label: string;           // shown in Settings UI
  isPremium: boolean;      // true = requires Theme Pack
  colors: {
    background: string;    // main screen bg
    card: string;          // card/surface bg
    foreground: string;    // primary text
    muted: string;         // hint/secondary text
    primary: string;       // progress ring, buttons, accents
    primaryForeground: string;
    border: string;
    tabActive: string;
    tabInactive: string;
    tabBackground: string;
  };
}

export const THEMES: Record<ThemeKey, AppTheme> = {
  ocean: {                 // FREE
    key: 'ocean',
    label: 'Ocean',
    isPremium: false,
    colors: {
      background: '#F0FFFE',
      card: '#FFFFFF',
      foreground: '#1A2E2B',
      muted: '#7A9E99',
      primary: '#2DC8A0',
      primaryForeground: '#FFFFFF',
      border: '#D0EDE8',
      tabActive: '#2DC8A0',
      tabInactive: '#9CA3AF',
      tabBackground: '#FFFFFF',
    },
  },
  forest: {                // PREMIUM
    key: 'forest',
    label: 'Forest',
    isPremium: true,
    colors: {
      background: '#F2F8F0',
      card: '#FFFFFF',
      foreground: '#1A2E1A',
      muted: '#7A9E7A',
      primary: '#4CAF50',
      primaryForeground: '#FFFFFF',
      border: '#C8E6C9',
      tabActive: '#4CAF50',
      tabInactive: '#9CA3AF',
      tabBackground: '#FFFFFF',
    },
  },
  sunset: {                // PREMIUM
    key: 'sunset',
    label: 'Sunset',
    isPremium: true,
    colors: {
      background: '#FFF8F5',
      card: '#FFFFFF',
      foreground: '#2E1A12',
      muted: '#9E7A6A',
      primary: '#FF6B35',
      primaryForeground: '#FFFFFF',
      border: '#FFD5C2',
      tabActive: '#FF6B35',
      tabInactive: '#9CA3AF',
      tabBackground: '#FFFFFF',
    },
  },
  midnight: {              // PREMIUM
    key: 'midnight',
    label: 'Midnight',
    isPremium: true,
    colors: {
      background: '#0F1923',
      card: '#1A2530',
      foreground: '#E8F0F5',
      muted: '#6B8A9E',
      primary: '#4FC3F7',
      primaryForeground: '#0F1923',
      border: '#2A3A48',
      tabActive: '#4FC3F7',
      tabInactive: '#4A5568',
      tabBackground: '#1A2530',
    },
  },
};

export function getTheme(key: ThemeKey): AppTheme {
  return THEMES[key] ?? THEMES.ocean;
}

export const FREE_THEMES = Object.values(THEMES).filter((t) => !t.isPremium);
export const PREMIUM_THEMES = Object.values(THEMES).filter((t) => t.isPremium);

// ─── THEME_PALETTE ────────────────────────────────────────────────────────────
// Derived from THEMES — used by SVG and chart props where NativeWind CSS
// variables cannot be used (e.g. react-native-svg fill/stroke, gifted-charts).
// primaryLight is a lighter tint of primary used for the ring track background.

interface ThemePalette {
  primary: string;
  primaryLight: string;
}

export const THEME_PALETTE: Record<ThemeKey, ThemePalette> = {
  ocean:    { primary: THEMES.ocean.colors.primary,    primaryLight: '#D6F5EE' },
  forest:   { primary: THEMES.forest.colors.primary,   primaryLight: '#D7F0E3' },
  sunset:   { primary: THEMES.sunset.colors.primary,   primaryLight: '#FDDDD4' },
  midnight: { primary: THEMES.midnight.colors.primary, primaryLight: '#1E3830' },
};
