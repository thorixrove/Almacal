import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { useLogWeight, useProfile } from "@/lib/api";
import { useThemeColors } from "@/lib/theme";

const LB_PER_KG = 2.20462;
const MIN_KG = 20;
const MAX_KG = 400;

// Layout modal memakai `style` (bukan className) karena isi <Modal> dirender di root native
// terpisah, dan di sana className tidak selalu terbaca — hasilnya kartu tanpa margin/sudut.
export function LogWeightModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const theme = useThemeColors();
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const inputBg = colorScheme === "dark" ? "#2C2C2E" : "#F3F3F7";

  const { data: profile } = useProfile();
  const logWeight = useLogWeight();

  const imperial = profile?.unitPreference === "imperial";
  const unit = imperial ? "lbs" : "kg";

  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Isi awal dengan berat terakhir yang diketahui, dalam satuan pilihan user.
  useEffect(() => {
    if (!visible) return;
    const kg = profile?.weightKg;
    setValue(kg ? (imperial ? kg * LB_PER_KG : kg).toFixed(1) : "");
    setError(null);
    logWeight.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const submit = () => {
    const entered = Number(value.replace(",", "."));
    const kg = imperial ? entered / LB_PER_KG : entered;

    if (!Number.isFinite(entered) || kg < MIN_KG || kg > MAX_KG) {
      setError(
        imperial
          ? t("progress.logWeight.rangeLbs", {
              min: Math.ceil(MIN_KG * LB_PER_KG),
              max: Math.floor(MAX_KG * LB_PER_KG),
            })
          : t("progress.logWeight.rangeKg", { min: MIN_KG, max: MAX_KG }),
      );
      return;
    }

    setError(null);
    // Server selalu menyimpan kg, dibulatkan ke 0,1.
    logWeight.mutate(Math.round(kg * 10) / 10, { onSuccess: onClose });
  };

  const message =
    error ??
    (logWeight.isError
      ? t("progress.logWeight.saveFailed", { message: logWeight.error.message })
      : null);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, justifyContent: "center", paddingHorizontal: 22 }}
      >
        <Pressable
          onPress={onClose}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
          }}
        />

        <View
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.border,
            borderWidth: 1,
            borderRadius: 24,
            padding: 22,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "700", color: theme.text }}>
            {t("progress.logWeight.title")}
          </Text>
          <Text style={{ marginTop: 4, fontSize: 14, color: theme.subtext }}>
            {t("progress.logWeight.subtitle")}
          </Text>

          <View
            style={{
              marginTop: 18,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: inputBg,
              borderRadius: 16,
              paddingHorizontal: 18,
            }}
          >
            <TextInput
              value={value}
              onChangeText={setValue}
              keyboardType="decimal-pad"
              autoFocus
              selectTextOnFocus
              maxLength={6}
              placeholder="0.0"
              placeholderTextColor={theme.subtext}
              onSubmitEditing={submit}
              style={{
                flex: 1,
                paddingVertical: 14,
                fontSize: 26,
                fontWeight: "700",
                color: theme.text,
              }}
            />
            <Text style={{ fontSize: 17, fontWeight: "500", color: theme.subtext }}>{unit}</Text>
          </View>

          {message ? (
            <Text style={{ marginTop: 10, fontSize: 13, color: "#D93025" }}>{message}</Text>
          ) : null}

          <View style={{ marginTop: 22, flexDirection: "row", gap: 10 }}>
            <Pressable
              onPress={onClose}
              disabled={logWeight.isPending}
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: 15,
                borderRadius: 999,
                backgroundColor: inputBg,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text }}>
                {t("progress.logWeight.cancel")}
              </Text>
            </Pressable>

            <Pressable
              onPress={submit}
              disabled={logWeight.isPending}
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: 15,
                borderRadius: 999,
                backgroundColor: theme.text,
              }}
            >
              {logWeight.isPending ? (
                <ActivityIndicator color={theme.cardBg} />
              ) : (
                <Text style={{ fontSize: 15, fontWeight: "600", color: theme.cardBg }}>
                  {t("progress.logWeight.save")}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}