import * as SecureStore from 'expo-secure-store';
import { useColorScheme } from 'nativewind';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme-preference';

/**
 * Guest-only fallback — used before sign-in (WelcomeScreen, sign-in, onboarding),
 * where there's no account yet to hold a real preference. Once signed in, the
 * account's `themePreference` (synced via useProfile/useUpdateProfile) is the
 * source of truth, and this device-local value gets overwritten by app-layout's
 * sync effect on every login.
 */
export async function loadThemePreference(): Promise<ThemePreference> {
  const value = await SecureStore.getItemAsync(STORAGE_KEY);
  return value === 'light' || value === 'dark' ? value : 'system';
}

export async function saveThemePreference(value: ThemePreference): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, value);
}

/**
 * One palette per effective scheme (NativeWind resolves 'system' to the OS setting
 * for us). `dark:` className variants handle everything static; this is only for
 * props that take a color directly — Ionicons, ActivityIndicator, chart lines, etc.
 */
const PALETTE = {
  light: {
    screenBg: '#F4F4F6',
    cardBg: '#FFFFFF',
    text: '#000000',
    subtext: '#8A8A90',
    subtext2: '#6E6E78',
    border: '#F1F1F3',
    icon: '#000000',
    chevron: '#C2C2C9',
    danger: '#C4453C',
  },
  dark: {
    screenBg: '#0B0B0C',
    cardBg: '#1C1C1E',
    text: '#FFFFFF',
    subtext: '#9A9AA0',
    subtext2: '#9A9AA0',
    border: '#2C2C2E',
    icon: '#FFFFFF',
    chevron: '#5A5A5E',
    danger: '#FF6961',
  },
} as const;

export function useThemeColors() {
  const { colorScheme } = useColorScheme();
  return PALETTE[colorScheme ?? 'light'];
}