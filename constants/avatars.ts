// ─────────────────────────────────────────────
// EDIT THIS FILE to customize or add avatars.
// Each avatar is fully self-contained.
// ─────────────────────────────────────────────

export type AvatarKey = 'drop' | 'bottle' | 'cup' | 'cat';

export interface AppAvatar {
  key: AvatarKey;
  label: string;
  isPremium: boolean;
  icon: string;       // Ionicons icon name
  emoji: string;      // emoji fallback
}

export const AVATARS: Record<AvatarKey, AppAvatar> = {
  drop:   { key: 'drop',   label: 'Water Drop', isPremium: false, icon: 'water',        emoji: '💧' },
  bottle: { key: 'bottle', label: 'Bottle',     isPremium: true,  icon: 'beer-outline',  emoji: '🍶' },
  cup:    { key: 'cup',    label: 'Cup',         isPremium: true,  icon: 'cafe-outline',  emoji: '☕' },
  cat:    { key: 'cat',    label: 'Cat Paw',     isPremium: true,  icon: 'paw-outline',   emoji: '🐾' },
};

export function getAvatar(key: AvatarKey): AppAvatar {
  return AVATARS[key] ?? AVATARS.drop;
}

export const FREE_AVATARS = Object.values(AVATARS).filter((a) => !a.isPremium);
export const PREMIUM_AVATARS = Object.values(AVATARS).filter((a) => a.isPremium);
