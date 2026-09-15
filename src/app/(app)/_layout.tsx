import { useAuth } from '@clerk/expo';
import { MaterialIcons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useProfile } from '@/lib/api';

export default function AppLayout() {
    const { isLoaded, isSignedIn } = useAuth();
    const { data: profile, isPending, isError, refetch } = useProfile();

    if (!isLoaded) return null;
    if (!isSignedIn) return <Redirect href="/" />;
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

    if (!profile?.onboardingCompletedAt) {
        return <Redirect href={{ pathname: '/onboarding/[step]', params: { step: 'gender' } }} />;
    }

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                lazy: false,
                animation: 'none',
                freezeOnBlur: false,
            }}
            tabBar={(props) => <CustomTabBar {...props} />}
        >
            <Tabs.Screen name="home" options={{ title: 'Home' }} />
            <Tabs.Screen name="camera" options={{ title: 'Scan' }} />
            <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
        </Tabs>
    );
}

const ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
    home: 'home',
    camera: 'photo-camera',
    profile: 'person',
};

function CustomTabBar({ state, navigation }: any) {
    const insets = useSafeAreaInsets();

    return (
        <View
            style={{ bottom: insets.bottom + 12 }}
            className="absolute left-[40px] right-[40px] flex-row items-center justify-between rounded-[50px] bg-white px-[15px] py-[5px] shadow-lg"
        >
            {state.routes.map((route: any, index: number) => {
                const focused = state.index === index;
                const label = route.name.charAt(0).toUpperCase() + route.name.slice(1);

                const onPress = () => {
                    if (focused) return;
                    navigation.navigate(route.name);
                    navigation.emit({ type: 'tabPress', target: route.key });
                };

                return (
                    <Pressable
                        key={route.key}
                        onPress={onPress}
                        className={`flex-1 items-center justify-center rounded-[50px] py-[10px] ${
                            focused ? 'bg-[#c0c0c0]' : ''
                        }`}
                    >
                        <MaterialIcons
                            name={ICONS[route.name]}
                            size={25}
                            color={focused ? '#FFFFFF' : '#9A9AA0'}
                        />
                        <Text
                            className={`mt-[2px] text-[10px] ${
                                focused ? 'font-semibold text-white' : 'text-[#9A9AA0]'
                            }`}
                        >
                            {label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

function Centered({ children }: { children?: React.ReactNode }) {
    return (
        <View className="flex-1 items-center justify-center bg-[#FEFDFD] px-[40px]">
            {children ?? <ActivityIndicator color="#000000" />}
        </View>
    );
}