import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import type { ReactNode } from 'react';
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

    return (
        <View
            className="flex-1 bg-[#FEFDFD]"
            style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
            <StatusBar style="dark" />

            <View className="mt-[4px] h-[24px] flex-row items-center px-[26px]">
                <Pressable onPress={() => router.back()} hitSlop={12}>
                    <SymbolView name="arrow.left" size={22} weight="medium" tintColor="#000000" />
                </Pressable>
                <View className="ml-[26px] flex-row gap-[10px]">
                    {Array.from({ length: SEGMENTS }, (_, i) => (
                        <View
                            key={i}
                            className={`h-[5px] w-[34px] rounded-full ${i < filled ? 'bg-black' : 'bg-[#D9D9DA]'}`}
                        />
                    ))}
                </View>
            </View>

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

            <ScrollView
                showsVerticalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 18 }}
                className="flex-1"
            >
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
    selected,
    tall,
    onPress,
}: {
    title: string;
    subtitle?: string;
    icon?: SFSymbol;
    glyph?: string;
    selected: boolean;
    tall?: boolean;
    onPress: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            className={`flex-row items-center rounded-[18px] px-[18px] py-[16px] ${selected ? 'border-[2px] border-black bg-white' : 'border border-[#EDEDEF] bg-[#F5F5F6]'}`}
            style={{
                minHeight: tall ? 96 : 72,
            }}
        >
            <View className={`items-center justify-center ${tall ? 'h-[52px] w-[52px]' : 'h-[42px] w-[42px]'}`}>
                {glyph ? (
                    <Text style={{ fontSize: 24, lineHeight: 28, includeFontPadding: false }}>
                        {glyph}
                    </Text>
                ) : icon ? (
                    <SymbolView name={icon} size={tall ? 28 : 24} weight="regular" tintColor="#000000" />
                ) : null}
            </View>
            <View className="ml-[14px] flex-1">
                <Text className="text-[17px] font-semibold leading-[22px] text-black">{title}</Text>
                {subtitle ? (
                    <Text className="mt-[2px] text-[14px] leading-[19px] text-[#6E6E78]">{subtitle}</Text>
                ) : null}
            </View>
            <View
                className={`h-[22px] w-[22px] items-center justify-center rounded-full ${selected ? 'bg-black' : 'border border-[#C8C8CC] bg-white'}`}
            >
                {selected ? (
                    <SymbolView name="checkmark" size={11} weight="bold" tintColor="#FFFFFF" />
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
                <Text className="text-[44px] font-bold leading-[48px] text-black">
                    {value.toFixed(decimals)}
                </Text>
                <Text className="mb-[10px] ml-[12px] text-[18px] leading-[20px] text-[#6E6E78]">
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
                    <View className="absolute left-0 right-0 top-[15px] h-[2px] bg-[#D9D9DA]" />
                    <View
                        className="absolute top-[15px] h-[2px] bg-black"
                        style={{ left: 0, width: `${percent}%` }}
                    />
                    <View
                        className="absolute top-[6px] h-[20px] w-[20px] rounded-full bg-black"
                        style={{
                            left: `${percent}%`,
                            transform: [{ translateX: -10 }],
                        }}
                    />
                </View>
            </View>
        </View>
    )
}