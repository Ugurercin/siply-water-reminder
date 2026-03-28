import { useCallback, useEffect, useState } from 'react';
import type { PurchasesState } from '@/types';
import { readPurchases, writePurchases } from '@/utils/storage';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UsePurchasesReturn {
  hasThemePack: boolean;
  hasPowerPack: boolean;
  isLoaded: boolean;
  /** Mock: immediately grants Theme Pack without a real payment. */
  purchaseThemePack: () => Promise<void>;
  /** Mock: immediately grants Power Pack without a real payment. */
  purchasePowerPack: () => Promise<void>;
  /**
   * Mock restore: re-reads AsyncStorage.
   * Returns 'restored' if any pack was previously purchased, 'nothing_to_restore' otherwise.
   * Phase 9B will replace this with a real RevenueCat restore call.
   */
  restorePurchases: () => Promise<'restored' | 'nothing_to_restore'>;
  /** DEV only: toggles Theme Pack owned state without going through the paywall. */
  devToggleThemePack: () => void;
  /** DEV only: toggles Power Pack owned state without going through the paywall. */
  devTogglePowerPack: () => void;
}

// ─── Default State ────────────────────────────────────────────────────────────

const DEFAULT_STATE: PurchasesState = {
  hasThemePack: false,
  hasPowerPack: false,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Tracks which IAP packages the user owns.
 *
 * Phase 9A — Mock mode:
 *   Purchase functions write a flag to AsyncStorage and return immediately.
 *   No real payment is processed. Data persists across app restarts.
 *
 * Phase 9B — Real mode:
 *   Replace the internals with RevenueCat SDK calls while keeping the same
 *   public interface so all consumers remain unchanged.
 */
export function usePurchases(): UsePurchasesReturn {
  const [state, setState] = useState<PurchasesState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persisted purchase state on mount
  useEffect(() => {
    void (async () => {
      const stored = await readPurchases();
      if (stored !== null) setState(stored);
      setIsLoaded(true);
    })();
  }, []);

  // Use the functional-updater pattern (consistent with other hooks in this codebase)
  // so the callbacks never go stale and can have empty dependency arrays.

  const purchaseThemePack = useCallback(async (): Promise<void> => {
    setState((prev) => {
      const next: PurchasesState = { ...prev, hasThemePack: true };
      void writePurchases(next);
      return next;
    });
  }, []);

  const purchasePowerPack = useCallback(async (): Promise<void> => {
    setState((prev) => {
      const next: PurchasesState = { ...prev, hasPowerPack: true };
      void writePurchases(next);
      return next;
    });
  }, []);

  const restorePurchases = useCallback(async (): Promise<'restored' | 'nothing_to_restore'> => {
    // Phase 9B: replace with Purchases.restoreTransactions()
    const stored = await readPurchases();
    if (stored !== null && (stored.hasThemePack || stored.hasPowerPack)) {
      setState(stored);
      return 'restored';
    }
    return 'nothing_to_restore';
  }, []);

  const devToggleThemePack = useCallback((): void => {
    setState((prev) => {
      const next: PurchasesState = { ...prev, hasThemePack: !prev.hasThemePack };
      void writePurchases(next);
      return next;
    });
  }, []);

  const devTogglePowerPack = useCallback((): void => {
    setState((prev) => {
      const next: PurchasesState = { ...prev, hasPowerPack: !prev.hasPowerPack };
      void writePurchases(next);
      return next;
    });
  }, []);

  return {
    hasThemePack: state.hasThemePack,
    hasPowerPack: state.hasPowerPack,
    isLoaded,
    purchaseThemePack,
    purchasePowerPack,
    restorePurchases,
    devToggleThemePack,
    devTogglePowerPack,
  };
}
