import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { useColorScheme } from 'nativewind';
import type { ComponentProps, ReactNode } from 'react';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SEGMENTS = 4;

export function OnboardingScreen({
    progress,
    title,
    subtitle,
    cta = 'Next',
    onNext,
    disabled,
    header,
    children,
}: {
    progress: number
    title?: string
    subtitle?: string
    cta?: string
    onNext: () => void
    disabled?: boolean
    header?: ReactNode
    children?: ReactNode
}) {
    const insets = useSafeAreaInsets()
    const router = useRouter()
    const filled = 1 + Math.floor(progress * (SEGMENTS - 1))
    // Langkah pertama (setelah gerbang mengarahkan user baru ke sini) tidak punya layar
    // sebelumnya — tombol kembali di situ memicu error "GO_BACK was not handled".
    const canGoBack = router.canGoBack()

    return (
        <View
            className="flex-1 bg-[#FEFDFD]"
            style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
            <StatusBar style="dark" />

            <View className="mt-[4px] h-[24px] flex-row items-center px-[26px]">
                {canGoBack ? (
                    <Pressable onPress={() => router.back()} hitSlop={12}>
                        <Ionicons name="arrow-back" size={22} color="#000000" />
                    </Pressable>
                ) : (
                    <View style={{ width: 22, height: 22 }} />
                )}
                <View className="ml-[26px] flex-row gap-[10px]">
                    {Array.from({ length: SEGMENTS }, (_, i) => (
                        <View
                            key={i}
                            className={`h-[5px] w-[34px] rounded-full ${i < filled ? 'bg-black' : 'bg-[#D9D9DA]'}`}
                        />
                    ))}
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 18 }}
                className="flex-1"
            >
                {title ? (
                    <Text className="ml-[26px] mt-[26px] w-[290px] text-[32px] font-bold leading-[38px] text-black">
                        {title}
                    </Text>
                ) : null}
                {subtitle ? (
                    <Text className="ml-[26px] mt-[6px] w-[264px] text-[17px] leading-[23px] text-[#4A4A52]">
                        {subtitle}
                    </Text>
                ) : null}
                {header}
                {children}
            </ScrollView>

            <Pressable
                onPress={onNext}
                disabled={disabled}
                className={`mx-[26px] mb-[16px] h-[50px] items-center justify-center rounded-[15px] ${disabled ? 'bg-[#C8C8CC]' : 'bg-black active:opacity-90'
                    }`}>
                <Text className="text-[17px] font-semibold text-white">{cta}</Text>
            </Pressable>
        </View>
    )
}

export function OptionCard({
    title,
    subtitle,
    icon,
    glyph,
    vectorIcon,
    selected,
    tall,
    onPress,
}: {
    title: string;
    subtitle?: string;
    icon?: SFSymbol;
    glyph?: string;
    /** Monochrome, cross-platform icon (Ionicons name) — use this instead of `glyph`
     *  (colored emoji) or `icon` (iOS-only SF Symbol) when you want a black icon that
     *  also renders on Android. */
    vectorIcon?: ComponentProps<typeof Ionicons>['name'];
    selected: boolean;
    tall?: boolean;
    onPress: () => void;
}) {
    const { colorScheme } = useColorScheme()
    const isDark = colorScheme === 'dark'
    const iconTint = isDark ? '#FFFFFF' : '#000000'

    return (
        <Pressable
            onPress={onPress}
            className={`flex-row items-center rounded-[18px] px-[18px] py-[16px] ${selected ? 'border-[2px] border-black bg-white dark:border-white dark:bg-[#1C1C1E]' : 'border border-[#EDEDEF] bg-[#F5F5F6] dark:border-[#2C2C2E] dark:bg-[#1C1C1E]'}`}
            style={{
                minHeight: tall ? 96 : 72,
            }}
        >
            <View className={`items-center justify-center ${tall ? 'h-[52px] w-[52px]' : 'h-[42px] w-[42px]'}`}>
                {vectorIcon ? (
                    <Ionicons name={vectorIcon} size={tall ? 28 : 24} color={iconTint} />
                ) : glyph ? (
                    <Text style={{ fontSize: 24, lineHeight: 28, includeFontPadding: false }}>
                        {glyph}
                    </Text>
                ) : icon ? (
                    <SymbolView name={icon} size={tall ? 28 : 24} weight="regular" tintColor={iconTint} />
                ) : null}
            </View>
            <View className="ml-[14px] flex-1">
                <Text className="text-[17px] font-semibold leading-[22px] text-black dark:text-white">{title}</Text>
                {subtitle ? (
                    <Text className="mt-[2px] text-[14px] leading-[19px] text-[#6E6E78] dark:text-[#9A9AA0]">{subtitle}</Text>
                ) : null}
            </View>
            <View
                className={`h-[22px] w-[22px] items-center justify-center rounded-full ${selected ? 'bg-black dark:bg-white' : 'border border-[#C8C8CC] bg-white dark:border-[#3A3A3C] dark:bg-[#1C1C1E]'}`}
            >
                {selected ? (
                    <Ionicons name="checkmark" size={11} color={isDark ? '#000000' : '#FFFFFF'} />
                ) : null}
            </View>
        </Pressable>
    )
}

const ITEM = 14
const VISIBLE = 16
const FADE = [1, 0.9, 0.72, 0.5, 0.3, 0.14]
const fadeStyle = (top: number, opacity: number) =>
    ({ position: 'absolute', left: 0, right: 0, top, height: 7, opacity, backgroundColor: '#FEFDFD' }) as const;

export function RulerPicker({
    value,
    onChange,
    min,
    max,
    increment,
    decimals = 0,
    unit,
}: {
    value: number;
    onChange: (v: number) => void;
    min: number;
    max: number;
    increment: number;
    decimals?: number;
    unit: string;
    labelEvery?: number;
    labelDecimals?: number;
}) {
    const [trackWidth, setTrackWidth] = useState(0)
    const { colorScheme } = useColorScheme()
    const isDark = colorScheme === 'dark'
    const safeRange = Math.max(max - min, increment)
    const percent = Math.min(100, Math.max(0, ((value - min) / safeRange) * 100))

    const updateFromTouch = (x: number) => {
        if (!trackWidth) return

        const clampedX = Math.min(trackWidth, Math.max(0, x))
        const ratio = clampedX / trackWidth
        const raw = min + ratio * (max - min)
        const snapped = Math.round(raw / increment) * increment
        const next = Math.min(max, Math.max(min, snapped))
        const rounded = Number(next.toFixed(decimals + 1))

        if (rounded !== value) {
            onChange(rounded)
        }
    }

    return (
        <View className="items-center justify-center">
            <View className="flex-row items-end justify-center">
                <Text className="text-[44px] font-bold leading-[48px] text-black dark:text-white">
                    {value.toFixed(decimals)}
                </Text>
                <Text className="mb-[10px] ml-[12px] text-[18px] leading-[20px] text-[#6E6E78] dark:text-[#9A9AA0]">
                    {unit}
                </Text>
            </View>

            <View className="mt-[18px] w-full items-center">
                <View
                    className="h-[32px] w-[84%] max-w-[320px] justify-center"
                    onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
                    onStartShouldSetResponder={() => true}
                    onMoveShouldSetResponder={() => true}
                    onResponderGrant={(e) => updateFromTouch(e.nativeEvent.locationX)}
                    onResponderMove={(e) => updateFromTouch(e.nativeEvent.locationX)}
                >
                    <View
                        className="absolute left-0 right-0 top-[15px] h-[2px]"
                        style={{ backgroundColor: isDark ? '#3A3A3C' : '#D9D9DA' }}
                    />
                    <View
                        className="absolute top-[15px] h-[2px]"
                        style={{ left: 0, width: `${percent}%`, backgroundColor: isDark ? '#FFFFFF' : '#000000' }}
                    />
                    <View
                        className="absolute top-[6px] h-[20px] w-[20px] rounded-full"
                        style={{
                            left: `${percent}%`,
                            transform: [{ translateX: -10 }],
                            backgroundColor: isDark ? '#FFFFFF' : '#000000',
                        }}
                    />
                </View>
            </View>
        </View>
    )
}