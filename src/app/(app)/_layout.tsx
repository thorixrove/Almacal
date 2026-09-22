import { useAuth } from '@clerk/expo';
import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { useProfile } from '@/lib/api';
import { useEffect } from 'react';
import { colorScheme } from 'nativewind';
import { ThemePreference } from '@/lib/theme';

export default function AppLayout() {
    const { isLoaded, isSignedIn } = useAuth();
    const { data: profile, isPending, isError, refetch } = useProfile();

    // TEMP DEBUG — hapus setelah gerbang onboarding terbukti jalan
    console.log('[gate]', JSON.stringify({
        isLoaded,
        isSignedIn,
        isPending,
        isError,
        onboardedAt: profile?.onboardingCompletedAt ?? null,
    }));

    useEffect(() => {
        if (profile?.themePreference) colorScheme.set(profile.themePreference as ThemePreference)
    }, [profile?.themePreference])


    console.log('[gate]', JSON.stringify({
        isLoaded,
        isSignedIn,
        isPending,
        isError,
        onboardedAt: profile?.onboardingCompletedAt ?? null,
    }))

    if (!isLoaded) return null;
    if (!isSignedIn) return <Redirect href="/sign-in" />;
    if (isPending) return <Centered />;

    if (isError) {
        return (
            <Centered>
                <Text className="text-center text-[16px] leading-[22px] text-[#4A4A52]">
                    We couldn&apos;t load your profile.
                </Text>
                <Pressable
                    onPress={() => refetch()}
                    className="mt-[16px] h-[44px] items-center justify-center rounded-full bg-black px-[26px] active:opacity-90"
                >
                    <Text className="text-[15px] font-semibold text-white">Retry</Text>
                </Pressable>
            </Centered>
        );
    }

    // Login sudah terjadi di awal; user baru (belum ada profil) diarahkan mengisi biodata.
    if (!profile?.onboardingCompletedAt) {
        return <Redirect href={{ pathname: '/onboarding/[step]', params: { step: 'gender' } }} />;
    }

    // Expo Router auto-discovers every route under this folder — (tabs) as the
    // tab-bar group, personal-details/index and personal-details/[field] as
    // ordinary pushed screens on top of it. No need to list them by hand unless
    // a screen needs custom options (e.g. presentation: 'modal').
    return <Stack screenOptions={{ headerShown: false }} />;
}

function Centered({ children }: { children?: React.ReactNode }) {
    return (
        <View className="flex-1 items-center justify-center bg-[#FEFDFD] px-[40px]">
            {children ?? <ActivityIndicator color="#000000" />}
        </View>
    );
}