import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { type ComponentProps, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from 'react-i18next';

import { useProfile, type Profile } from '@/lib/api';
import { useThemeColors } from '@/lib/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

function Card({ children }: { children: ReactNode }) {
  return (
    <View className="mx-[18px] overflow-hidden rounded-[20px] bg-white dark:bg-[#1C1C1E]">
      {children}
    </View>
  );
}

function Row({
  icon,
  label,
  value,
  onPress,
  divider,
}: {
  icon: IconName;
  label: string;
  value: string;
  onPress: () => void;
  divider?: boolean;
}) {
  const theme = useThemeColors();

  return (
    <View className={divider ? 'border-t border-[#F1F1F3] dark:border-[#2C2C2E]' : undefined}>
      <Pressable
        onPress={onPress}
        className="flex-row items-center px-[18px] py-[15px] active:bg-[#F7F7F9] dark:active:bg-[#242426]">
        <Ionicons name={icon} size={21} color={theme.icon} style={{ width: 24, height: 24 }} />
        <Text className="ml-[12px] flex-1 text-[17px] text-black dark:text-white" numberOfLines={1}>
          {label}
        </Text>
        <Text className="text-[16px] text-[#8A8A90] dark:text-[#9A9AA0]" numberOfLines={1}>
          {value}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={theme.chevron}
          style={{ width: 16, height: 16, marginLeft: 6 }}
        />
      </Pressable>
    </View>
  );
}

const capitalize = (s?: string | null) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '—');

const formatDate = (s?: string | null) =>
  s
    ? new Date(s).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

/**
 * `key` matches a step key in `@/onboarding/steps` — the edit screen
 * (`personal-details/[field].tsx`) looks the step up by this same key, so the
 * two files stay in sync automatically if the questionnaire changes.
 */
const FIELDS: { key: string; icon: IconName; labelKey: string; format: (p: Profile) => string }[] = [
  { key: 'gender', icon: 'male-female', labelKey: 'personalDetails.gender', format: (p) => capitalize(p.gender) },
  { key: 'birthday', icon: 'calendar', labelKey: 'personalDetails.birthday', format: (p) => formatDate(p.dateOfBirth) },
  {
    key: 'height',
    icon: 'resize',
    labelKey: 'personalDetails.height',
    format: (p) => (p.heightCm ? `${p.heightCm} cm` : '—'),
  },
  {
    key: 'weight',
    icon: 'barbell',
    labelKey: 'personalDetails.weight',
    format: (p) => (p.weightKg ? `${p.weightKg} kg` : '—'),
  },
  { key: 'goal', icon: 'flag', labelKey: 'personalDetails.goal', format: (p) => capitalize(p.goal) },
  {
    key: 'target-weight',
    icon: 'trophy',
    labelKey: 'personalDetails.targetWeight',
    format: (p) => (p.targetWeightKg ? `${p.targetWeightKg} kg` : '—'),
  },
  {
    key: 'activity',
    icon: 'flash',
    labelKey: 'personalDetails.activityLevel',
    format: (p) => capitalize(p.activityLevel),
  },
  {
    key: 'pace',
    icon: 'speedometer',
    labelKey: 'personalDetails.pace',
    format: (p) => (p.paceKgPerWeek ? `${p.paceKgPerWeek} kg/week` : '—'),
  },
  {
    key: 'diet',
    icon: 'nutrition',
    labelKey: 'personalDetails.dietPreference',
    format: (p) => capitalize(p.dietPreference),
  },
];

export default function PersonalDetails() {
  const insets = useSafeAreaInsets();
  const { data: profile, isLoading } = useProfile();
  const theme = useThemeColors();
  const { t } = useTranslation();
  const { colorScheme: resolvedScheme } = useColorScheme();

  return (
    <View className="flex-1 bg-[#F4F4F6] dark:bg-[#0B0B0C]" style={{ paddingTop: insets.top }}>
      <StatusBar style={resolvedScheme === 'dark' ? 'light' : 'dark'} />

      <View className="h-[44px] flex-row items-center px-[10px]">
        <Pressable onPress={() => router.back()} hitSlop={12} className="flex-row items-center px-[8px]">
          <Ionicons name="chevron-back" size={26} color={theme.icon} />
        </Pressable>
        <Text className="ml-[2px] text-[17px] font-semibold text-black dark:text-white">
          {t('personalDetails.title')}
        </Text>
      </View>

      {isLoading || !profile ? (
        <View className="mt-[40px] items-center">
          <ActivityIndicator color={theme.icon} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: insets.bottom + 28 }}>
          <Card>
            {FIELDS.map((f, i) => (
              <Row
                key={f.key}
                icon={f.icon}
                label={t(f.labelKey)}
                value={f.format(profile)}
                divider={i > 0}
                onPress={() =>
                  router.push({ pathname: '/personal-details/[field]', params: { field: f.key } })
                }
              />
            ))}
          </Card>
        </ScrollView>
      )}
    </View>
  );
}