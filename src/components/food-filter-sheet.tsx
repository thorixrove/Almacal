import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, PanResponder, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { DEFAULT_FOOD_FILTERS, type FoodFilters, type FoodSort } from '@/lib/api';

const MAX_SHEET_HEIGHT = Dimensions.get('window').height * 0.85;
const DRAG_TO_CLOSE_THRESHOLD = 120;
const DRAG_TO_CLOSE_VELOCITY = 0.8;

type Option<T> = { value: T; label: string };

const SORTS: Option<FoodSort>[] = [
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'calories', label: 'Highest calories' },
    { value: 'protein', label: 'Highest protein' },
]

const DAYS: Option<number | null>[] = [
    { value: null, label: 'Any time' },
    { value: 1, label: 'Today' },
    { value: 7, label: 'Last 7 days' },
    { value: 30, label: 'Last 30 days' },
]

const PROTEIN: Option<number | null>[] = [
    { value: null, label: 'Any' },
    { value: 10, label: '10g+' },
    { value: 20, label: '20g+' },
    { value: 30, label: '30g+' },
    { value: 40, label: '40g+' },
]

type CalorieRange = Pick<FoodFilters, 'minCalories' | 'maxCalories'>

const CALORIES: { label: string; range: CalorieRange }[] = [
    { label: 'Any', range: { minCalories: null, maxCalories: null } },
    { label: 'Under 300', range: { minCalories: null, maxCalories: 299 } },
    { label: '300–600', range: { minCalories: 300, maxCalories: 600 } },
    { label: 'Over 600', range: { minCalories: 601, maxCalories: null } },
]

type Props = {
    visible: boolean
    filters: FoodFilters
    onApply: (filters: FoodFilters) => void
    onClose: () => void
}

export function FoodFilterSheet({ visible, filters, onApply, onClose }: Props) {
    const insets = useSafeAreaInsets()
    const { t } = useTranslation()
    const [draft, setDraft] = useState(filters)
    const translateY = useRef(new Animated.Value(0)).current

    useEffect(() => {
        if (visible) {
            setDraft(filters)
            translateY.setValue(0)
        }
    }, [visible])

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gesture) => {
                if (gesture.dy > 0) translateY.setValue(gesture.dy)
            },
            onPanResponderRelease: (_, gesture) => {
                if (gesture.dy > DRAG_TO_CLOSE_THRESHOLD || gesture.vy > DRAG_TO_CLOSE_VELOCITY) {
                    Animated.timing(translateY, {
                        toValue: Dimensions.get('window').height,
                        duration: 180,
                        useNativeDriver: true,
                    }).start(onClose)
                } else {
                    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
                }
            },
        }),
    ).current

    const caloriesActive = (r: CalorieRange) =>
        r.minCalories === draft.minCalories && r.maxCalories === draft.maxCalories

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable className="flex-1 justify-end bg-black/45" onPress={onClose}>
                <Pressable onPress={() => {}} style={{ maxHeight: MAX_SHEET_HEIGHT }}>
                    <Animated.View
                        className="rounded-t-[28px] bg-white dark:bg-[#1C1C1E]"
                        style={{ transform: [{ translateY }] }}
                    >
                        <View  {...panResponder.panHandlers} className="items-center py-[14px]">
                            <View className="h-[4px] w-[36px] rounded-full bg-[#E2E2E6] dark:bg-[#3A3A3C]" />
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: insets.bottom + 22 }}
                        >
                            <Text className="text-[20px] font-bold text-black dark:text-white">
                                {t('foods.filter.title', 'Filter')}
                            </Text>

                            <Section title={t('foods.filter.sort', 'Sort by')}>
                                {SORTS.map((o) => (
                                    <Chip
                                        key={o.value}
                                        label={t(`foods.filter.sorts.${o.value}`, o.label)}
                                        active={draft.sort === o.value}
                                        onPress={() => setDraft({ ...draft, sort: o.value })}
                                    />
                                ))}
                            </Section>

                            <Section title={t('foods.filter.date', 'Scanned')}>
                                {DAYS.map((o) => (
                                    <Chip
                                        key={String(o.value)}
                                        label={t(`foods.filter.days.${o.value ?? 'any'}`, o.label)}
                                        active={draft.days === o.value}
                                        onPress={() => setDraft({ ...draft, days: o.value })}
                                    />
                                ))}
                            </Section>

                            <Section title={t('foods.filter.protein', 'Minimum protein')}>
                                {PROTEIN.map((o) => (
                                    <Chip
                                        key={String(o.value)}
                                        label={t(`foods.filter.proteins.${o.value ?? 'any'}`, o.label)}
                                        active={draft.minProtein === o.value}
                                        onPress={() => setDraft({ ...draft, minProtein: o.value })}
                                    />
                                ))}
                            </Section>

                            <Section title={t('foods.filter.calories', 'Calories')}>
                                {CALORIES.map((o) => (
                                    <Chip
                                        key={o.label}
                                        label={t(`foods.filter.calorieRanges.${o.label}`, o.label)}
                                        active={caloriesActive(o.range)}
                                        onPress={() => setDraft({ ...draft, ...o.range })}
                                    />
                                ))}
                            </Section>

                            <View className="mt-[20px] flex-row gap-[12px]">
                                <Pressable
                                    onPress={() => setDraft(DEFAULT_FOOD_FILTERS)}
                                    className="h-[50px] flex-1 items-center justify-center rounded-full border border-[#E2E2E6] active:opacity-70 dark:border-[#3A3A3C]"
                                >
                                    <Text className="text-[16px] font-semibold text-black dark:text-white">
                                        {t('foods.filter.reset', 'Reset')}
                                    </Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => onApply(draft)}
                                    className="h-[50px] flex-1 items-center justify-center rounded-full bg-black active:opacity-90 dark:bg-white"
                                >
                                    <Text className="text-[16px] font-semibold text-white dark:text-black">
                                        {t('foods.filter.apply', 'Apply')}
                                    </Text>
                                </Pressable>
                            </View>
                        </ScrollView>
                    </Animated.View>
                </Pressable>
            </Pressable>
        </Modal>
    )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View className="mt-[22px]">
            <Text className="text-[14px] font-semibold text-[#8A8A90] dark:text-[#9A9AA0]">{title}</Text>
            <View className="mt-[10px] flex-row flex-wrap gap-[8px]">{children}</View>
        </View>
    )
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
    return (
        <Pressable
            onPress={onPress}
            style={{ height: 36 }}
            className={`justify-center rounded-full border px-[16px] active:opacity-70 ${active
                ? 'border-black bg-black dark:border-white dark:bg-white'
                : 'border-[#EDEDEF] bg-white dark:border-[#2C2C2E] dark:bg-[#242426]'
                }`}
        >
            <Text
                className={`text-[14px] font-medium ${active ? 'text-white dark:text-black' : 'text-black dark:text-white'
                    }`}
            >
                {label}
            </Text>
        </Pressable>
    )
}