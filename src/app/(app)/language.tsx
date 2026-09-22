import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset } from '@/constants/theme';
import { useProfile, useUpdateProfile } from '@/lib/api';
import type { LanguagePreference } from '@/lib/i18n';
import { applyLanguage, saveLanguagePreference } from '@/lib/language';
import { useThemeColors } from '@/lib/theme';

const OPTIONS: { value: LanguagePreference; labelKey: string }[] = [
    { value: 'system', labelKey: 'language.system' },
    { value: 'en', labelKey: 'language.english' },
    { value: 'id', labelKey: 'language.indonesian' },
]


export default function LanguageScreen() {
    const insets = useSafeAreaInsets()
    const theme = useThemeColors()
    const { t } = useTranslation()
    const { data: profile } = useProfile()
    const update = useUpdateProfile()

    const selected = profile?.languagePreference ?? 'system'

    const select = async (value: LanguagePreference) => {
        applyLanguage(value)
        await saveLanguagePreference(value)
        update.mutate({ languagePreference: value })
    }

    return (
        <View className="flex-1 bg-[#F4F4F6] dark:bg-[#0B0B0C]" style={{ paddingTop: insets.top }}>
            <View className="flex-row items-center px-[18px] py-[12px]">
                <Pressable onPress={() => router.back()} hitSlop={12}>
                    <Ionicons name="chevron-back" size={24} color={theme.icon} />
                </Pressable>
                <Text className="ml-[8px] text-[20px] font-bold text-black dark:text-white">
                    {t('language.title')}
                </Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + BottomTabInset + 28 }}>
                <View className="mx-[18px] mt-[10px] overflow-hidden rounded-[20px] bg-white dark:bg-[#1C1C1E]">
                    {OPTIONS.map((opt, i) => (
                        <Pressable
                            key={opt.value}
                            onPress={() => select(opt.value)}
                            className={`flex-row items-center justify-between px-[18px] py-[15px] active:bg-[#F7F7F9] dark:active:bg-[#242426] ${i > 0 ? 'border-t border-[#F1F1F3] dark:border-[#2C2C2E]' : ''
                                }`}
                        >
                            <Text className="text-[17px] text-black dark:text-white">{t(opt.labelKey)}</Text>
                            {selected === opt.value ? (
                                <Ionicons name="checkmark" size={20} color={theme.icon} />
                            ) : null}
                        </Pressable>
                    ))}
                </View>
            </ScrollView>
        </View>
    )
}