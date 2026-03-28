import type { VolumeUnit, WeightUnit } from '@/types';

// ─── Conversion Constants ─────────────────────────────────────────────────────

const ML_PER_OZ = 29.5735;
const ML_PER_CUP = 236.588;
const KG_PER_LB = 0.453592;

// ─── Volume Conversions ───────────────────────────────────────────────────────

/**
 * Convert ml → display unit (for showing values to the user).
 * All stored data is in ml; call this only at the UI boundary.
 */
export function mlToDisplay(ml: number, unit: VolumeUnit): number {
  switch (unit) {
    case 'ml':
      return ml;
    case 'oz':
      return ml / ML_PER_OZ;
    case 'cups':
      return ml / ML_PER_CUP;
  }
}

/**
 * Convert a display-unit value → ml (for saving user input to storage).
 * Call this only when reading from user input before persisting.
 */
export function displayToMl(value: number, unit: VolumeUnit): number {
  switch (unit) {
    case 'ml':
      return value;
    case 'oz':
      return value * ML_PER_OZ;
    case 'cups':
      return value * ML_PER_CUP;
  }
}

// ─── Weight Conversions ───────────────────────────────────────────────────────

/**
 * Convert kg → display unit (for showing weight to the user).
 */
export function kgToDisplay(kg: number, unit: WeightUnit): number {
  switch (unit) {
    case 'kg':
      return kg;
    case 'lbs':
      return kg / KG_PER_LB;
  }
}

/**
 * Convert a display-unit weight value → kg (for saving user input to storage).
 */
export function displayToKg(value: number, unit: WeightUnit): number {
  switch (unit) {
    case 'kg':
      return value;
    case 'lbs':
      return value * KG_PER_LB;
  }
}

// ─── Formatting ───────────────────────────────────────────────────────────────

/**
 * Format a ml value with its unit label.
 * Examples: "250 ml", "8.5 oz", "1.1 cups"
 */
export function formatVolume(ml: number, unit: VolumeUnit): string {
  const value = mlToDisplay(ml, unit);
  switch (unit) {
    case 'ml':
      return `${Math.round(value)} ml`;
    case 'oz':
      return `${value.toFixed(1)} oz`;
    case 'cups':
      return `${value.toFixed(1)} cups`;
  }
}

/**
 * Format a kg value with its unit label.
 * Examples: "70 kg", "154 lbs"
 */
export function formatWeight(kg: number, unit: WeightUnit): string {
  const value = kgToDisplay(kg, unit);
  switch (unit) {
    case 'kg':
      return `${Math.round(value)} kg`;
    case 'lbs':
      return `${Math.round(value)} lbs`;
  }
}

// ─── Preset Quick-Add Amounts ─────────────────────────────────────────────────

/**
 * Returns the quick-add preset amounts in the user's preferred unit.
 * The values displayed on buttons; call displayToMl() before saving.
 */
export function getPresetAmounts(unit: VolumeUnit): number[] {
  switch (unit) {
    case 'ml':
      return [150, 250, 350, 500];
    case 'oz':
      return [6, 8, 12, 16];
    case 'cups':
      return [0.5, 1, 1.5, 2];
  }
}
