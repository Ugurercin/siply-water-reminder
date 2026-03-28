import type { Theme } from '@/types';

interface ThemeColors {
  /** Primary action color — used for ring fill, icons, button text */
  primary: string;
  /** Lighter tint for the ring track background */
  primaryLight: string;
}

/**
 * Actual hex values per theme.
 * These are needed wherever NativeWind CSS variables can't be used
 * (e.g. react-native-svg fill/stroke props).
 * All other UI colors must still use NativeWind CSS variable classes.
 */
export const THEME_PALETTE: Record<Theme, ThemeColors> = {
  ocean: {
    primary: '#2DC8A0',
    primaryLight: '#D6F5EE',
  },
  forest: {
    primary: '#4CAF7D',
    primaryLight: '#D7F0E3',
  },
  sunset: {
    primary: '#F4845F',
    primaryLight: '#FDDDD4',
  },
  midnight: {
    primary: '#2DC8A0',
    primaryLight: '#1E3830',
  },
} as const;
