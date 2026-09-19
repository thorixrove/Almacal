import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colorScheme, useColorScheme } from 'nativewind';
import { type ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type Profile, useProfile, useUpdateProfile } from '@/lib/api';
import { loadThemePreference, saveThemePreference, useThemeColors, type ThemePreference } from '@/lib/theme';

function Card({ children }: { children: ReactNode }) {
  return (
    <View className="mx-[18px] overflow-hidden rounded-[20px] bg-white dark:bg-[#1C1C1E]">
      {children}
    </View>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Text className="ml-[26px] mb-[8px] mt-[18px] text-[15px] font-medium text-[#8A8A90] dark:text-[#9A9AA0]">
      {children}
    </Text>
  );
}

function SelectRow({
  title,
  subtitle,
  selected,
  onPress,
  disabled,
  divider,
  checkColor,
}: {
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  divider?: boolean;
  checkColor: string;
}) {
  return (
    <View className={divider ? 'border-t border-[#F1F1F3] dark:border-[#2C2C2E]' : undefined}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        className="flex-row items-center px-[18px] py-[15px] active:bg-[#F7F7F9] dark:active:bg-[#242426]">
        <View className="flex-1">
          <Text className="text-[17px] text-black dark:text-white">{title}</Text>
          <Text className="mt-[2px] text-[14px] text-[#8A8A90] dark:text-[#9A9AA0]">{subtitle}</Text>
        </View>
        {selected ? <Ionicons name="checkmark-circle" size={22} color={checkColor} /> : null}
      </Pressable>
    </View>
  );
}

const UNIT_OPTIONS: { value: NonNullable<Profile['unitPreference']>; title: string; subtitle: string }[] = [
  { value: 'metric', title: 'Metric', subtitle: 'Kilograms, centimeters' },
  { value: 'imperial', title: 'Imperial', subtitle: 'Pounds, feet & inches' },
];

const THEME_OPTIONS: { value: ThemePreference; title: string; subtitle: string }[] = [
  { value: 'system', title: 'System', subtitle: 'Match your device setting' },
  { value: 'light', title: 'Light', subtitle: 'Always use light mode' },
  { value: 'dark', title: 'Dark', subtitle: 'Always use dark mode' },
];

export default function Preferences() {
  const insets = useSafeAreaInsets();
  const { data: profile, isLoading } = useProfile();
  const update = useUpdateProfile();
  const theme = useThemeColors();
  // Resolved scheme (never 'system') — StatusBar needs the actual light/dark, not the preference.
  const { colorScheme: resolvedScheme } = useColorScheme();

  const [themePreference, setThemePreference] = useState<ThemePreference | null>(null);

  useEffect(() => {
    loadThemePreference().then((pref) => {
      setThemePreference(pref);
      colorScheme.set(pref);
    });
  }, []);

  const chooseTheme = (value: ThemePreference) => {
    setThemePreference(value);
    colorScheme.set(value);
    saveThemePreference(value);
  };

  return (
    <View className="flex-1 bg-[#F4F4F6] dark:bg-[#0B0B0C]" style={{ paddingTop: insets.top }}>
      <StatusBar style={resolvedScheme === 'dark' ? 'light' : 'dark'} />

      <View className="h-[44px] flex-row items-center px-[10px]">
        <Pressable onPress={() => router.back()} hitSlop={12} className="flex-row items-center px-[8px]">
          <Ionicons name="chevron-back" size={26} color={theme.icon} />
        </Pressable>
        <Text className="ml-[2px] text-[17px] font-semibold text-black dark:text-white">
          Preferences
        </Text>
      </View>

      <SectionTitle>Theme</SectionTitle>
      <Card>
        {THEME_OPTIONS.map((option, i) => (
          <SelectRow
            key={option.value}
            title={option.title}
            subtitle={option.subtitle}
            selected={themePreference === option.value}
            divider={i > 0}
            checkColor={theme.icon}
            onPress={() => chooseTheme(option.value)}
          />
        ))}
      </Card>

      {isLoading || !profile ? (
        <View className="mt-[40px] items-center">
          <ActivityIndicator color={theme.icon} />
        </View>
      ) : (
        <>
          <SectionTitle>Units</SectionTitle>
          <Card>
            {UNIT_OPTIONS.map((option, i) => (
              <SelectRow
                key={option.value}
                title={option.title}
                subtitle={option.subtitle}
                selected={profile.unitPreference === option.value}
                disabled={update.isPending}
                divider={i > 0}
                checkColor={theme.icon}
                onPress={() => update.mutate({ unitPreference: option.value })}
              />
            ))}
          </Card>

          {update.isError ? (
            <Text className="mx-[26px] mt-[10px] text-[14px] text-[#C4453C] dark:text-[#FF6961]">
              Couldn&apos;t save. Please try again.
            </Text>
          ) : null}
        </>
      )}
    </View>
  );
}