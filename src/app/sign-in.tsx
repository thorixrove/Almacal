import { useAuth, useSSO } from '@clerk/expo';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useColorScheme } from 'nativewind';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Provider = 'oauth_apple' | 'oauth_google';

// router.replace('/home') sebelumnya terpanggil 2-5x per login. Flag di level modul ini
// memastikan navigasi cuma sekali sampai user sign out.
let navigated = false;

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { startSSOFlow } = useSSO();
  const { isSignedIn } = useAuth();
  const { t } = useTranslation();
  const [busy, setBusy] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pindah hanya setelah Clerk benar-benar melaporkan isSignedIn=true (bukan tepat setelah
  // setActive), supaya layout tujuan tidak membaca isSignedIn yang masih basi.
  // Tujuannya /home: (app)/_layout yang memutuskan — profil belum ada → onboarding,
  // sudah ada → tab.
  useEffect(() => {
    if (isSignedIn) {
      if (!navigated) {
        navigated = true;
        router.replace('/home');
      }
    } else {
      navigated = false; // sudah sign out — izinkan login berikutnya
    }
  }, [isSignedIn, router]);

  const signInWith = async (strategy: Provider) => {
    if (busy) return;
    setBusy(strategy);
    setError(null);
    let keepBusy = false;
    try {
      // sudah login tapi masih di layar ini: navigasi sebelumnya gagal, ulangi
      if (isSignedIn) {
        router.replace('/home');
        return;
      }

      const { createdSessionId, setActive, signUp } = await startSSOFlow({
        strategy,
        redirectUrl: Linking.createURL('/auth-callback', { scheme: 'almacal' }),
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        // jangan pindah di sini — effect di atas yang menangani begitu isSignedIn true.
        // Spinner dibiarkan menyala sampai layar ini ditutup.
        keepBusy = true;
        return;
      }
      if (signUp?.status === 'missing_requirements') {
        setError(t('auth.errorMissingRequirements'));
      }
      // otherwise the sheet was dismissed — stay put, say nothing
    } catch (err) {
      setError(t('auth.errorGeneric'));
      console.error('SSO error:', JSON.stringify(err, null, 2));
    } finally {
      if (!keepBusy) setBusy(null);
    }
  };

  return (
    <View
      className={`flex-1 ${isDark ? 'bg-[#0B0B0C]' : 'bg-[#FEFDFD]'}`}
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View className="mt-[4px] h-[24px] flex-row items-center px-[26px]">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <SymbolView name="arrow.left" size={22} weight="medium" tintColor={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
      </View>

      <View className="flex-1 items-center justify-center px-[26px]">
        <Image
          source={require('@/assets/images/almacal.png')}
          style={{ width: 62, height: 72 }}
          contentFit="contain"
        />
        <Text className={`mt-[26px] text-center text-[32px] font-bold leading-[38px] ${isDark ? 'text-white' : 'text-black'}`}>
          {t('auth.welcome')}
        </Text>
        <Text className={`mt-[8px] w-[290px] text-center text-[17px] leading-[23px] ${isDark ? 'text-[#B2B2B7]' : 'text-[#4A4A52]'}`}>
          {t('auth.subtitle')}
        </Text>
      </View>

      <View className="px-[26px]">
        {Platform.OS === 'ios' ? (
          <Pressable
            onPress={() => signInWith('oauth_apple')}
            disabled={busy !== null}
            className={`h-[52px] flex-row items-center justify-center rounded-[15px] bg-black ${
              busy ? 'opacity-60' : 'active:opacity-90'
            }`}>
            {busy === 'oauth_apple' ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <SymbolView name="apple.logo" size={19} tintColor="#FFFFFF" />
                <Text className="ml-[10px] text-[17px] font-semibold text-white">
                  {t('auth.continueApple')}
                </Text>
              </>
            )}
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => signInWith('oauth_google')}
          disabled={busy !== null}
          className={`mt-[12px] h-[52px] flex-row items-center justify-center rounded-[15px] border ${isDark ? 'border-[#3A3A3C] bg-[#1C1C1E]' : 'border-[#DEDEE2] bg-white'} ${
            busy ? 'opacity-60' : 'active:opacity-90'
          }`}>
          {busy === 'oauth_google' ? (
            <ActivityIndicator color={isDark ? '#FFFFFF' : '#000000'} />
          ) : (
            <>
              <Image
                source={require('@/assets/images/google-g.svg')}
                style={{ width: 19, height: 19 }}
                contentFit="contain"
              />
              <Text className={`ml-[10px] text-[17px] font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                {t('auth.continueGoogle')}
              </Text>
            </>
          )}
        </Pressable>

        {error ? (
          <Text className="mt-[12px] text-center text-[14px] leading-[19px] text-[#C4453C]">
            {error}
          </Text>
        ) : null}

        <Text className="mb-[6px] mt-[16px] text-center text-[12px] leading-[17px] text-[#8A8A90]">
          {t('auth.terms')}
        </Text>
      </View>
    </View>
  );
}