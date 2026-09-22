import { useAuth } from "@clerk/expo";
import { Image } from "expo-image";
import { Redirect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { t } = useTranslation();

  if (isLoaded && isSignedIn) return <Redirect href="/home" />;

  return (
    <View
      className="flex-1 bg-[#FEFDFD]"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <StatusBar style="dark" />

      <View className="mt-[22px] flex-row items-center justify-center gap-[10px]">
        <Image
          source={require("@/assets/images/almacal.png")}
          style={{ width: 41, height: 47, marginBottom: 8 }}
          contentFit="contain"
        />
        <Text className="text-[32px] font-bold text-black">AlmaCal</Text>
      </View>

      <View className="mt-[13px] items-center">
        <Image
          source={require("@/assets/images/phone-mockup.png")}
          style={{ width: 231, height: 455 }}
          contentFit="contain"
        />
      </View>

      <View className="items-center px-[26px]">
        <Text className="mt-[14px] w-[265px] text-center text-[32px] font-bold leading-[37px] tracking-[-0.4px] text-black">
          {t("welcome.title")}
        </Text>

        <Pressable
          onPress={() => router.push("/sign-in")}
          className="mt-[17px] h-[48px] w-full flex-row items-center justify-center rounded-full bg-black active:opacity-90"
        >
          <Text className="text-[16px] font-bold tracking-[-0.4px] text-white">{t("welcome.getStarted")}</Text>
          <Text
            className="absolute text-white"
            style={{
              right: 20,
              top: "40%",
              fontSize: 30,
              lineHeight: 26,
              transform: [{ translateY: -13 }],
            }}
          >
            →
          </Text>
        </Pressable>
      </View>
    </View>
  );
}