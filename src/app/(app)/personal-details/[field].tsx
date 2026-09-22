import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OptionCard, RulerPicker } from '@/components/onboarding';
import { type Profile, useProfile, useUpdateProfile } from '@/lib/api';
import { useThemeColors } from '@/lib/theme';
import { stepIndex, steps } from '@/onboarding/steps';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => i + 1);
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1900 + 1 }, (_, i) => CURRENT_YEAR - i);
const FALLBACK_DOB = new Date(Date.now() - 25 * 31557600000).toISOString().slice(0, 10);



function BirthdayWheelPicker({
    value,
    onChange,
}: {
    value?: string
    onChange: (date: string) => void
}) {
    const { colorScheme: resolvedScheme } = useColorScheme()
    const isDark = resolvedScheme === 'dark'

    const baseDate = value ? new Date(value) : new Date(FALLBACK_DOB)
    const initialDay = baseDate.getDate()
    const initialMonth = baseDate.getMonth()
    const initialYear = baseDate.getFullYear()

    const [day, setDay] = useState(initialDay)
    const [month, setMonth] = useState(initialMonth)
    const [year, setYear] = useState(initialYear)

    const commit = (nextDay: number, nextMonth: number, nextYear: number) => {
        const next = new Date(nextYear, nextMonth, nextDay)
        setDay(next.getDate())
        setMonth(next.getMonth())
        setYear(next.getFullYear())
        onChange(next.toISOString().slice(0, 10))
    }

    const renderColumn = (
        items: Array<number | string>,
        selectedIndex: number,
        onSelect: (Index: number) => void,
    ) => {
        const itemHeight = 32
        const listHeight = itemHeight * 5

        return (
            <View style={{ height: listHeight, width: '33.33%' }}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    snapToInterval={itemHeight}
                    decelerationRate="fast"
                    contentContainerStyle={{ paddingVertical: (listHeight - itemHeight) / 2 }}
                    onMomentumScrollEnd={(e) => {
                        const index = Math.round(e.nativeEvent.contentOffset.y / itemHeight);
                        if (index >= 0 && index < items.length) onSelect(index);
                    }}
                    contentOffset={{ x: 0, y: selectedIndex * itemHeight }}
                >
                    {items.map((item, index) => {
                        const isSelected = index === selectedIndex
                        return (
                            <View
                                key={`${String(item)}-${index}`}
                                style={{ height: itemHeight, justifyContent: 'center', alignItems: 'center' }}
                            >
                                <Text
                                    style={{
                                        fontSize: isSelected ? 18 : 16,
                                        color: isSelected
                                            ? (isDark ? '#F5F5F6' : '#111827')
                                            : (isDark ? '#6B6B70' : '#9CA3AF'),
                                        fontWeight: isSelected ? '600' : '400',
                                        opacity: isSelected ? 1 : 0.7,
                                    }}
                                >
                                    {item}
                                </Text>
                            </View>
                        )
                    })}
                </ScrollView>

                <View
                    pointerEvents="none"
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: (listHeight - itemHeight) / 2,
                        height: itemHeight,
                        borderTopWidth: 1,
                        borderBottomWidth: 1,
                        borderColor: isDark ? '#3A3A3C' : '#E5E7EB',
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.2)',
                    }}
                />
            </View>
        )
    }


    const dayIndex = DAY_OPTIONS.indexOf(day)
    const monthIndex = month
    const yearIndex = YEAR_OPTIONS.indexOf(year)

    return (
        <View className="flex-row items-center justify-between rounded-[18px] bg-[#F5F5F6] px-[18px] py-[8px] dark:bg-[#1C1C1E]">
            {renderColumn(DAY_OPTIONS, dayIndex, (index) => commit(DAY_OPTIONS[index], month, year))}
            {renderColumn(MONTHS, monthIndex, (index) => commit(day, index, year))}
            {renderColumn(YEAR_OPTIONS, yearIndex, (index) => commit(day, month, YEAR_OPTIONS[index]))}
        </View>
    )
}

export default function EditPersonalDetail() {
    const { field: key } = useLocalSearchParams<{ field: string }>()
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const { data: profile } = useProfile()
    const update = useUpdateProfile()
    const theme = useThemeColors()
    const { colorScheme: resolvedScheme } = useColorScheme()


    const index = stepIndex(key)
    const step = steps[index]


    const [value, setValue] = useState<string | number | undefined>(() =>
        profile && step ? (profile[step.field as keyof Profile] as string | number | undefined) : undefined,
    )

    if (!step || !profile) return <Redirect href="/personal-details" />

    const save = () => {
        if (value === undefined) return
        update.mutate({ [step.field]: value } as Partial<Profile>, {
            onSuccess: () => router.back(),
        })
    }

    return (
        <View className="flex-1 bg-[#F4F4F6] dark:bg-[#0B0B0C]" style={{ paddingTop: insets.top }}>
            <StatusBar style={resolvedScheme === 'dark' ? 'light' : 'dark'} />

            <View className="h-[44px] flex-row items-center justify-between px-[18px]">
                <Pressable onPress={() => router.back()} hitSlop={12}>
                    <Ionicons name="close" size={24} color={theme.icon} />
                </Pressable>
                <Pressable onPress={save} disabled={update.isPending || value === undefined} hitSlop={12}>
                    {update.isPending ? (
                        <ActivityIndicator color={theme.icon} />
                    ) : (
                        <Text
                            className="text-[17px] font-semibold"
                            style={{ color: value === undefined ? theme.chevron : theme.icon }}
                        >
                            Save
                        </Text>
                    )}
                </Pressable>
            </View>


            <Text className="mx-[26px] mt-[10px] text-[26px] font-bold text-black dark:text-white">
                {step.title}
            </Text>
            <Text className="mx-[26px] mt-[4px] text-[15px] leading-[20px] text-[#6E6E78] dark:text-[#9A9AA0]">
                {step.subtitle}
            </Text>

            {update.isError ? (
                <Text className="mx-[26px] mt-[10px] text-[14px] text-[#C4453C] dark:text-[#FF6961]">
                    Couldn&apos;t save. Please try again.
                </Text>
            ) : null}

            {step.kind === 'cards' && (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingTop: 24, paddingBottom: 16, paddingHorizontal: 26, gap: 10 }}>
                    {step.options.map((o) => (
                        <OptionCard
                            key={o.value}
                            title={o.title}
                            subtitle={o.subtitle}
                            icon={o.icon}
                            glyph={o.glyph}
                            vectorIcon={o.vectorIcon}
                            tall={step.tall}
                            selected={value === o.value}
                            onPress={() => setValue(o.value)}
                        />
                    ))}
                </ScrollView>
            )}

            {step.kind === 'date' && (
                <View className="mt-[24px] px-[26px]">
                    <BirthdayWheelPicker
                        value={typeof value === 'string' ? value : undefined}
                        onChange={setValue}
                    />
                </View>
            )}

            {step.kind === 'ruler' && (
                <View className="mt-[30px]">
                    <RulerPicker
                        value={typeof value === 'number' ? value : step.min}
                        onChange={setValue}
                        min={step.min}
                        max={step.max}
                        increment={step.increment}
                        decimals={step.decimals}
                        labelEvery={step.labelEvery}
                        labelDecimals={step.labelDecimals}
                        unit={step.unit}
                    />
                </View>
            )}
        </View>
    )
}