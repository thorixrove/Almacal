import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { type ComponentProps, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useProfile, type Profile } from '@/lib/api';

type IconName = ComponentProps<typeof Ionicons>['name']

function Card({ children }: { children: ReactNode }) {
    return <View className="mx-[18px] overflow-hidden rounded-[20px] bg-white">{children}</View>
}

function Row({
    icon,
    label,
    value,
    onPress,
    divider,
}: {
    icon: IconName
    label: string
    value: string
    onPress: () => void
    divider?: boolean
}) {
    return (
        <View style={divider ? { borderTopWidth: 1, borderTopColor: '#F1F1F3' } : undefined}>
            <Pressable
                onPress={onPress}
                className="flex-row items-center px-[18px] py-[15px] active:bg-[#F7F7F9]"
            >
                <Ionicons name={icon} size={21} color="#000000" style={{ width: 24, height: 24 }} />
                <Text className="ml-[12px] flex-1 text-[17px] text-black" numberOfLines={1}>
                    {label}
                </Text>
                <Text className="text-[16px] text-[#8A8A90]" numberOfLines={1}>
                    {value}
                </Text>
                <Ionicons
                    name='chevron-forward'
                    size={16}
                    color="#C2C2C9"
                    style={{ width: 16, height: 16, marginLeft: 6 }}
                />
            </Pressable>
        </View>
    )
}

const capitalize = (s?: string | null) => (s ? s.charAt(0).toLocaleUpperCase() + s.slice(1) : '-')

const formatDate = (s?: string | null) => s
    ? new Date(s).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'


const FIELDS: { key: string; icon: IconName; label: string; format: (p: Profile) => string }[] = [
    { key: 'gender', icon: 'male-female', label: 'Gender', format: (p) => capitalize(p.gender) },
    { key: 'birthday', icon: 'calendar', label: 'Birthday', format: (p) => formatDate(p.dateOfBirth) },
    {
        key: 'height',
        icon: 'resize',
        label: 'Height',
        format: (p) => (p.heightCm ? `${p.heightCm} cm` : '—'),
    },
    {
        key: 'weight',
        icon: 'barbell',
        label: 'Weight',
        format: (p) => (p.weightKg ? `${p.weightKg} kg` : '—'),
    },
    { key: 'goal', icon: 'flag', label: 'Goal', format: (p) => capitalize(p.goal) },
    {
        key: 'target-weight',
        icon: 'trophy',
        label: 'Target weight',
        format: (p) => (p.targetWeightKg ? `${p.targetWeightKg} kg` : '—'),
    },
    {
        key: 'activity',
        icon: 'flash',
        label: 'Activity level',
        format: (p) => capitalize(p.activityLevel),
    },
    {
        key: 'pace',
        icon: 'speedometer',
        label: 'Pace',
        format: (p) => (p.paceKgPerWeek ? `${p.paceKgPerWeek} kg/week` : '—'),
    },
    { key: 'diet', icon: 'nutrition', label: 'Diet preference', format: (p) => capitalize(p.dietPreference) },
]


export default function PersonalDetail() {
    const insets = useSafeAreaInsets()
    const { data: profile, isLoading } = useProfile()

    return (
        <View className="flex-1 bg-[#F4F4F6]" style={{ paddingTop: insets.top }}>
            <StatusBar style="dark" />

            <View className="h-[44px] flex-row items-center px-[10px]">
                <Pressable onPress={() => router.back()} hitSlop={12} className="flex-row items-center px-[8px]">
                    <Ionicons name="chevron-back" size={26} color="#000000" />
                </Pressable>
                <Text className="ml-[2px] text-[17px] font-semibold text-black">Personal Details</Text>
            </View>

            {isLoading || !profile ? (
                <View className="mt-[40px] items-center">
                    <ActivityIndicator color="#000000" />
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingTop: 10, paddingBottom: insets.bottom + 28 }}
                >
                    <Card>
                        {FIELDS.map((f, i) => (
                            <Row
                                key={f.key}
                                icon={f.icon}
                                label={f.label}
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
    )
}