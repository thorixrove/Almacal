import { useAuth, useSSO } from '@clerk/expo';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSaveProfile } from '@/lib/api';
import { draft } from '@/onboarding/steps';

type Provider = 'oauth_apple' | 'oauth_google';

// Di log, router.replace('/home') terpanggil 2-5x per login. Flag di level modul ini
// memastikan finish() cuma jalan sekali sampai user sign out (atau penyimpanan gagal).
let finishing = false;

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { startSSOFlow } = useSSO();
  const { isSignedIn } = useAuth();
  const save = useSaveProfile();
  const [busy, setBusy] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  // only show the plan chip to someone who just finished the questionnaire
  const plan = draft.plan;

  /** A plan generated before sign-up is persisted the moment there's an account. */
  const finish = async () => {
    if (finishing) return;
    finishing = true;
    const t0 = Date.now();
    try {
      if (draft.plan) {
        await save.mutateAsync();
        console.log(`[sign-in] simpan profil selesai: ${Date.now() - t0} ms`);
      }
      router.replace('/home');
      console.log(`[sign-in] router.replace('/home') dipanggil @ ${Date.now()} (+${Date.now() - t0} ms)`);
    } catch {
      // gagal simpan: lepas spinner supaya user bisa mencoba lagi lewat tombol
      finishing = false;
      setBusy(null);
      setError('We couldn’t save your plan. Please try again.');
    }
  };

  // Navigate only once Clerk's context has actually caught up to isSignedIn=true.
  // Doing this reactively (instead of right after setActive resolves) avoids a
  // race where (app)/app-layout mounts, reads a still-stale isSignedIn=false,
  // and bounces back to "/" before the context finishes updating.
  useEffect(() => {
    if (isSignedIn) finish();
    else finishing = false; // sudah sign out — izinkan login berikutnya
  }, [isSignedIn]);

  useEffect(() => {
    console.log(`[sign-in] mounted @ ${Date.now()}`)
    return () => console.log(`[sign-in] unmounted @ ${Date.now()}`)
  }, [])

  const signInWith = async (strategy: Provider) => {
    if (busy) return;
    setBusy(strategy);
    setError(null);
    let keepBusy = false;
    try {
      // already signed in means the save failed last time — retry it from here
      if (isSignedIn) {
        await finish();
        return;
      }

      const t0 = Date.now();
      const { createdSessionId, setActive, signUp } = await startSSOFlow({
        strategy,
        redirectUrl: Linking.createURL('/auth-callback', { scheme: 'almacal' }),
      });
      console.log(`[sign-in] startSSOFlow selesai: ${Date.now() - t0} ms`);
      if (createdSessionId && setActive) {
        const t1 = Date.now();
        await setActive({ session: createdSessionId });
        console.log(`[sign-in] setActive selesai: ${Date.now() - t1} ms`);
        // don't navigate here — the isSignedIn effect above handles it once Clerk's
        // context has updated. Keep the spinner on until then (busy is cleared by
        // finish() on failure, or when this screen unmounts on success).
        keepBusy = true;
        return;
      }
      if (signUp?.status === 'missing_requirements') {
        setError('Your account needs a few more details. Please try the other provider.');
      }
      // otherwise the sheet was dismissed — stay put, say nothing
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('SSO error:', JSON.stringify(err, null, 2));
    } finally {
      if (!keepBusy) setBusy(null);
    }
  };

  return (
    <View
      className="flex-1 bg-[#FEFDFD]"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <StatusBar style="dark" />

      <View className="mt-[4px] h-[24px] flex-row items-center px-[26px]">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <SymbolView name="arrow.left" size={22} weight="medium" tintColor="#000000" />
        </Pressable>
      </View>

      <View className="flex-1 items-center justify-center px-[26px]">
        <Image
          source={require('@/assets/images/almacal.png')}
          style={{ width: 62, height: 72 }}
          contentFit="contain"
        />
        <Text className="mt-[26px] text-center text-[32px] font-bold leading-[38px] text-black">
          Save your plan
        </Text>
        <Text className="mt-[8px] w-[290px] text-center text-[17px] leading-[23px] text-[#4A4A52]">
          Sign in to keep your targets, streak and meal history on every device.
        </Text>

        {plan ? (
          <View className="mt-[26px] flex-row items-center rounded-full border border-[#EDEDEF] bg-white px-[18px] py-[10px]">
            <SymbolView name="checkmark.circle.fill" size={17} tintColor="#000000" />
            <Text className="ml-[8px] text-[15px] leading-[20px] text-[#4A4A52]">
              Your plan is ready —{' '}
              <Text className="font-semibold text-black">
                {plan.calories.toLocaleString('en-US')} cal / day
              </Text>
            </Text>
          </View>
        ) : null}
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
                  Continue with Apple
                </Text>
              </>
            )}
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => signInWith('oauth_google')}
          disabled={busy !== null}
          className={`mt-[12px] h-[52px] flex-row items-center justify-center rounded-[15px] border border-[#DEDEE2] bg-white ${
            busy ? 'opacity-60' : 'active:opacity-90'
          }`}>
          {busy === 'oauth_google' ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <>
              <Image
                source={require('@/assets/images/google-g.svg')}
                style={{ width: 19, height: 19 }}
                contentFit="contain"
              />
              <Text className="ml-[10px] text-[17px] font-semibold text-black">
                Continue with Google
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
          By continuing you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </View>
  );
}