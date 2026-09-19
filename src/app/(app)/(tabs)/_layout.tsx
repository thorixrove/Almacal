import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
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