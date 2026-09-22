import { useAuth } from '@clerk/expo';
import { MaterialIcons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
    const { isLoaded, isSignedIn } = useAuth();


        useEffect(() => {
        console.log(`[tabs] mounted @ ${Date.now()}`);
    }, []);

    if (!isLoaded) return null;
    if (!isSignedIn) return <Redirect href="/sign-in" />;

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
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <View
            style={{ bottom: insets.bottom + 12 }}
            className="absolute left-[40px] right-[40px] flex-row items-center justify-between rounded-[50px] bg-white px-[15px] py-[5px] shadow-lg dark:bg-[#000000]"
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
                            focused ? (isDark ? 'bg-[#3A3A3E]' : 'bg-[#c0c0c0]') : ''
                        }`}
                    >
                        <MaterialIcons
                            name={ICONS[route.name]}
                            size={25}
                            color={focused ? '#FFFFFF' : isDark ? '#7A7A80' : '#9A9AA0'}
                        />
                        <Text
                            className={`mt-[2px] text-[10px] ${
                                focused ? 'font-semibold text-white' : isDark ? 'text-[#7A7A80]' : 'text-[#9A9AA0]'
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