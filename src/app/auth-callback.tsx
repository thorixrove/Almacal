import { useAuth } from '@clerk/expo';
import { Redirect } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function AuthCallback() {
    const { isLoaded, isSignedIn} = useAuth()
    const { colorScheme} = useColorScheme()
    const [timedOut, setTimedOut] = useState(false)


 useEffect(() => {
        console.log(`[auth-callback] mounted @ ${Date.now()}`);
        // Kalau sesi tidak kunjung aktif (login gagal), jangan tahan user di spinner selamanya
        const timer = setTimeout(() => setTimedOut(true), 10_000);
        return () => {
            clearTimeout(timer);
            console.log(`[auth-callback] unmounted @ ${Date.now()}`);
        };
    }, []);


if ( isLoaded && isSignedIn) return <Redirect href="/home" />
if (timedOut) return <Redirect href="/sign-in" />

return(
    <View className="flex-1 items-center justify-center bg-[#FEFDFD] dark:bg-[#0B0B0C]">
        <ActivityIndicator color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}/>
    </View>
)
}