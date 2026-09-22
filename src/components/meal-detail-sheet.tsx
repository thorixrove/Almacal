import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { Image } from 'expo-image';
import { useColorScheme } from 'nativewind';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Modal,
    PanResponder,
    Pressable,
    ScrollView,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ring } from '@/components/ring';
import { MACROS } from '@/constants/macros';

// SFSymbol names from MACROS are iOS-only; map by key to a cross-platform Ionicons name.
const MACRO_VECTOR_ICON: Record<'protein' | 'carbs' | 'fat', ComponentProps<typeof Ionicons>['name']> = {
    protein: 'water',
    carbs: 'leaf',
    fat: 'flame',
};

const thumbnail = (url: string, pt: number) => `${url}?tr=w-${pt * 3},h-${pt * 3},q-70`;

const mealType = (d: Date) => {
    const h = d.getHours();
    return h < 11 ? 'Breakfast' : h < 16 ? 'Lunch' : h < 21 ? 'Dinner' : 'Snack';
};

// Cap sheet height so it never grows past the visible screen — this is what
// makes it scrollable instead of pushing the bottom (and the Close/Delete
// buttons) off-screen.
const MAX_SHEET_HEIGHT = Dimensions.get('window').height * 0.85;

const DRAG_TO_CLOSE_THRESHOLD = 90

const DRAG_TO_CLOSE_VELOCITY = 1.2


export type DetailMeal = {
    id: string;
    imageUrl: string;
    status: 'analyzing' | 'completed' | 'failed';
    name: string | null;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    errorReason: string | null;
    loggedAt: Date;
};

export function MealDetailSheet({
    meal,
    onClose,
    onDelete,
    deleting,
    dailyTarget,
}: {
    meal: DetailMeal | null;
    onClose: () => void;
    onDelete: (id: string) => void;
    deleting: boolean;

    dailyTarget: { protein: number; carbs: number; fat: number }
}) {
    const insets = useSafeAreaInsets();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const translateY = useRef(new Animated.Value(0)).current
    const [confirming, setConfirming] = useState(false)

    useEffect(() => {
        if (meal)
            translateY.setValue(0)
        setConfirming(false)
    }, [meal?.id])

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 4,
            onPanResponderMove: (_, gesture) => {
                if (gesture.dy > 0) translateY.setValue(gesture.dy)
            },
            onPanResponderRelease: (_, gesture) => {
                const shouldClose =
                    gesture.dy > DRAG_TO_CLOSE_THRESHOLD || gesture.vy > DRAG_TO_CLOSE_VELOCITY

                if (shouldClose) {
                    Animated.timing(translateY, {
                        toValue: Dimensions.get('window').height,
                        duration: 180,
                        useNativeDriver: true
                    }).start(onClose)
                } else {
                    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start()
                }
            },
        }),
    ).current


    return (
        <Modal visible={!!meal} transparent animationType="slide" onRequestClose={onClose}>
            {/*
        Backdrop and sheet are nested, not competing absolute siblings — RN's
        responder system always gives an inner Pressable the touch first, so this
        can't misfire on Android the way absolute + zIndex did.
        The backdrop is a flex column ending at the bottom (justify-end), so the
        sheet just sits in normal flow instead of being manually positioned.
      */}
            <Pressable className="flex-1 justify-end bg-black/45" onPress={onClose}>
                {meal ? (
                    // Swallow taps so they don't bubble to the backdrop's onPress and close the sheet.
                    <Pressable onPress={() => { }} style={{ maxHeight: MAX_SHEET_HEIGHT }}>
                        <Animated.View
                            className="rounded-t-[28px] bg-white dark:bg-[#1C1C1E]"
                            style={{ transform: [{ translateY }] }}
                        >
                            <View {...panResponder.panHandlers} className="items-center py-[14px]">
                                <View className="h-[4px] w-[36px] rounded-full bg-[#E2E2E6] dark:bg-[#3A3A3C]" />
                            </View>
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: insets.bottom + 22 }}
                            >
                                <View className="mt-[14px] flex-row items-center">
                                    <Image
                                        source={{ uri: thumbnail(meal.imageUrl, 64) }}
                                        style={{ width: 64, height: 64, borderRadius: 18 }}
                                        contentFit="cover"
                                        transition={200}
                                    />
                                    <View className="ml-[14px] flex-1">
                                        <Text numberOfLines={2} className="text-[18px] font-bold text-black dark:text-white">
                                            {meal.status === 'completed'
                                                ? meal.name
                                                : meal.status === 'analyzing'
                                                    ? 'Analyzing...'
                                                    : meal.errorReason === 'not_food'
                                                        ? 'Not food'
                                                        : "Couldn't read this one"}
                                        </Text>
                                        <Text className="mt-[2px] text-[13px] text-[#8A8A90] dark:text-[#9A9AA0]">
                                            {meal.loggedAt.toLocaleTimeString('en-US', {
                                                hour: 'numeric',
                                                minute: '2-digit',
                                            })}{' '}
                                            · {mealType(meal.loggedAt)}
                                        </Text>
                                    </View>
                                </View>


                                {meal.status === 'completed' ? (
                                    <>
                                        <View className="mt-[20px] flex-row items-center justify-center rounded-[16px] bg-[#F8F8FA] dark:bg-[#242426] py-[14px]">
                                            <Text className="text-[30px] font-bold leading-[34px] text-black dark:text-white">
                                                {meal.calories}
                                            </Text>
                                            <Text className="ml-[6px] text-[14px] font-medium text-[#8A8A90] dark:text-[#9A9AA0]">kcal</Text>
                                        </View>

                                        <View className="mt-[16px] flex-row gap-[10px]">
                                            {MACROS.map((macro) => {
                                                const target = dailyTarget[macro.key]
                                                const progress = target > 0 ? meal[macro.key] / target : 0
                                                return (
                                                    <View
                                                        key={macro.key}
                                                        className="flex-1 items-center rounded-[16px] border border-[#EDEDEF] dark:border-[#2C2C2E] py-[14px]"
                                                    >
                                                        <Ring size={40} stroke={5} progress={progress} color={macro.color} track={isDark ? '#3A3A3C' : '#EDEDF5'}>
                                                            <Ionicons name={MACRO_VECTOR_ICON[macro.key]} size={15} color={macro.color} />
                                                        </Ring>
                                                        <Text className="mt-[8px] text-[15px] font-bold text-black dark:text-white">
                                                            {meal[macro.key]}g
                                                        </Text>
                                                        <Text className="mt-[1px] text-[11px] text-[#8A8A90] dark:text-[#9A9AA0]">{macro.label}</Text>
                                                    </View>
                                                )
                                            })}
                                        </View>
                                    </>
                                ) : meal.status === 'analyzing' ? (
                                    <View className="mt-[20px] items-center rounded-[16px] bg-[#F8F8FA] dark:bg-[#242426] py-[24px]">
                                        <ActivityIndicator color={isDark ? '#9A9AA0' : '#8A8A90'} />
                                    </View>
                                ) : null}

                                {confirming ? (
                                    <View className="mt-[20px] flex-row gap-[10px]">
                                        <Pressable
                                            onPress={() => setConfirming(false)}
                                            disabled={deleting}
                                            className="h-[48px] flex-1 items-center justify-center rounded-full border border-[#EDEDEF] dark:border-[#3A3A3C] active:bg-[#F3F3F7] dark:active:bg-[#242426]"
                                        >
                                            <Text className="text-[15px] font-semibold text-black dark:text-white">No</Text>
                                        </Pressable>
                                        <Pressable
                                            onPress={() => onDelete(meal.id)}
                                            disabled={deleting}
                                            className={`h-[48px] flex-1 flex-row items-center justify-center rounded-full bg-[#E5484D] ${deleting ? 'opacity-60' : 'active:opacity-90'
                                                }`}
                                        >
                                            {deleting ? (
                                                <ActivityIndicator color="#FFFFFF" />
                                            ) : (
                                                <Text className="text-[15px] font-semibold text-white">Yes, delete</Text>
                                            )}
                                        </Pressable>
                                    </View>
                                ) : (
                                    <Pressable
                                        onPress={() => setConfirming(true)}
                                        className="mt-[20px] h-[48px] flex-row items-center justify-center rounded-full border border-[#E5484D] active:bg-[#FBEAEA] dark:active:bg-[#3A1E1F]"
                                    >
                                        <Ionicons name="trash-outline" size={17} color="#E5484D" />
                                        <Text className="ml-[8px] text-[15px] font-semibold text-[#E5484D]">Delete</Text>
                                    </Pressable>
                                )}
                            </ScrollView>
                        </Animated.View >
                    </Pressable>
                ) : null}
            </Pressable>
        </Modal>
    );
}