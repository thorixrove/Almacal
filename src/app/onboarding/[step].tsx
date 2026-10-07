import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { OnboardingScreen, OptionCard, RulerPicker } from '@/components/onboarding';
import { answers, stepIndex, steps } from '@/onboarding/steps';

const YEAR = 31557600000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => i + 1);
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1900 + 1 }, (_, i) => CURRENT_YEAR - i);

function BirthdayWheelPicker({
    value,
    onChange,
}: {
    value?: string;
    onChange: (date: string) => void;
}) {
    const baseDate = value ? new Date(value) : new Date(Date.now() - 25 * YEAR);
    const initialDay = baseDate.getDate();
    const initialMonth = baseDate.getMonth();
    const initialYear = baseDate.getFullYear();

    const [day, setDay] = useState(initialDay);
    const [month, setMonth] = useState(initialMonth);
    const [year, setYear] = useState(initialYear);

    const commit = (nextDay: number, nextMonth: number, nextYear: number) => {
        const next = new Date(nextYear, nextMonth, nextDay);
        setDay(next.getDate());
        setMonth(next.getMonth());
        setYear(next.getFullYear());
        onChange(next.toISOString().slice(0, 10));
    };

    const renderColumn = (
        items: Array<number | string>,
        selectedIndex: number,
        onSelect: (index: number) => void,
    ) => {
        const itemHeight = 32;
        const listHeight = itemHeight * 5;

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
                        const isSelected = index === selectedIndex;
                        return (
                            <View
                                key={`${String(item)}-${index}`}
                                style={{ height: itemHeight, justifyContent: 'center', alignItems: 'center' }}
                            >
                                <Text
                                    style={{
                                        fontSize: isSelected ? 18 : 16,
                                        color: isSelected ? '#111827' : '#9CA3AF',
                                        fontWeight: isSelected ? '600' : '400',
                                        opacity: isSelected ? 1 : 0.7,
                                    }}
                                >
                                    {item}
                                </Text>
                            </View>
                        );
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
                        borderColor: '#E5E7EB',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                    }}
                />
            </View>
        );
    };

    const dayIndex = DAY_OPTIONS.indexOf(day);
    const monthIndex = MONTHS.indexOf(MONTHS[month]);
    const yearIndex = YEAR_OPTIONS.indexOf(year);

    return (
        <View className="flex-row items-center justify-between rounded-[18px] bg-[#F5F5F6] px-[18px] py-[8px]">
            {renderColumn(DAY_OPTIONS, dayIndex, (index) => commit(DAY_OPTIONS[index], month, year))}
            {renderColumn(MONTHS, monthIndex, (index) => commit(day, index, year))}
            {renderColumn(YEAR_OPTIONS, yearIndex, (index) => commit(day, month, YEAR_OPTIONS[index]))}
        </View>
    );
}

export default function OnboardingStep() {
    const { step: key } = useLocalSearchParams<{ step: string }>()
    const router = useRouter()
    const index = stepIndex(key)
    const step = steps[index]
    const store = answers as Record<string, string | number | undefined>
    const [value, setValue] = useState(() => (step ? store[step.field] : undefined))

    if (!step) return <Redirect href="/" />

    const commit = (v: string | number) => {
        setValue(v)
        store[step.field] = v
    }

    const next = steps[index + 1]
    const shell = {
        progress: (index + 1) / steps.length,
        title: step.title,
        subtitle: step.subtitle,
        disabled: value === undefined,
        onNext: () =>
            next
                ? router.push({ pathname: '/onboarding/[step]', params: { step: next.key } })
                : router.push('/onboarding/building'),
    }

    if (step.kind === 'cards') {
        return (
            <OnboardingScreen {...shell}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingTop: 38, paddingBottom: 16, paddingHorizontal: 26, gap: 10 }}
                    className="flex-1"
                >
                    {step.options.map((o) => (
                        <OptionCard
                            key={o.value}
                            title={o.title}
                            subtitle={o.subtitle}
                            icon={o.icon}
                            glyph={o.glyph}
                            tall={step.tall}
                            selected={value === o.value}
                            onPress={() => commit(o.value)}
                        />
                    ))}
                </ScrollView>
            </OnboardingScreen>
        )
    }

    if (step.kind === 'date') {
        return (
            <OnboardingScreen {...shell}>
                <View className="mt-[18px] px-[26px]">
                    <BirthdayWheelPicker value={typeof value === 'string' ? value : undefined} onChange={(date) => commit(date)} />
                </View>
            </OnboardingScreen>
        )
    }

    const current = typeof value === 'number' ? value : step.min
    const note = step.note?.(current)

    return (
        <OnboardingScreen {...shell} disabled={false}>
            <View className="mt-[30px]">
                <RulerPicker
                    value={current}
                    onChange={commit}
                    min={step.min}
                    max={step.max}
                    increment={step.increment}
                    decimals={step.decimals}
                    labelEvery={step.labelEvery}
                    labelDecimals={step.labelDecimals}
                    unit={step.unit}
                />
                {note ? (
                    <Text className="mt-[28px] px-[40px] text-center text-[14px] leading-[19px] text-[#8A6D2F]">
                        {note}
                    </Text>
                ) : null}
            </View>
        </OnboardingScreen>
    )
}