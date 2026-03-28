import type { ActivityLevel, WeightUnit } from '@/types';
import { displayToKg } from '@/utils/units';

// ─── Constants ────────────────────────────────────────────────────────────────

const ML_PER_KG = 33;
const ROUND_TO_ML = 50;
const MIN_GOAL_ML = 1500;
const MAX_GOAL_ML = 4000;

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  low: 1.0,
  medium: 1.2,
  high: 1.4,
};

// ─── Goal Calculation ─────────────────────────────────────────────────────────

interface GoalInput {
  weight: number;
  weightUnit: WeightUnit;
  activityLevel: ActivityLevel;
}

/**
 * Calculate the daily hydration goal in ml.
 *
 * Accepts weight in any unit and converts to kg internally.
 * Always returns a value in ml, clamped between MIN and MAX.
 *
 * Formula: (weightKg × 33) × activityMultiplier, rounded to nearest 50 ml
 */
export function calculateDailyGoalMl({ weight, weightUnit, activityLevel }: GoalInput): number {
  const weightKg = displayToKg(weight, weightUnit);
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel];
  const rawMl = weightKg * ML_PER_KG * multiplier;
  const rounded = Math.round(rawMl / ROUND_TO_ML) * ROUND_TO_ML;
  return Math.min(MAX_GOAL_ML, Math.max(MIN_GOAL_ML, rounded));
}
