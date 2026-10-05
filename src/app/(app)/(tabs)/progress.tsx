import { useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ConsistencyCard } from "@/components/consistency-card";
import { LogWeightModal } from "@/components/log-weight-modal";
import { StreakCalendarCard } from "@/components/streak-calendar-card";
import { WeightTrendCard, type WeightPoint } from "@/components/weight-chart";
import { BottomTabInset } from "@/constants/theme";
import { useProgress } from "@/lib/api";
import { useThemeColors } from "@/lib/theme";

const PROGRESS_DAYS = 30;

/** "2026-05-18" -> "May 18" / "18 Mei", mengikuti bahasa aplikasi (bukan bahasa perangkat). */
const formatDay = (iso: string, language: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(language, { month: "short", day: "numeric" });

const TABS = [{ key: "weight" }, { key: "calories" }, { key: "macros" }] as const;

type TabKey = (typeof TABS)[number]["key"];

function SegmentedTabs({
  value,
  onChange,
}: {
  value: TabKey;
  onChange: (key: TabKey) => void;
}) {
  const { t } = useTranslation();

  return (
    <View className="mx-[22px] mt-[18px] flex-row rounded-full bg-[#F3F3F7] p-[4px] dark:bg-[#1C1C1E]">
      {TABS.map((tab) => {
        const active = tab.key === value;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            className={`flex-1 items-center rounded-full py-[10px] ${
              active ? "bg-white dark:bg-[#2C2C2E]" : ""
            }`}
          >
            <Text
              className={`text-[14px] ${
                active
                  ? "font-semibold text-black dark:text-white"
                  : "font-medium text-[#8A8A90] dark:text-[#9A9AA0]"
              }`}
            >
              {t(`progress.tabs.${tab.key}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Kartu dasar — sama dengan gaya kartu di home. */
export function ProgressCard({ children }: { children: React.ReactNode }) {
  return (
    <View className="mx-[22px] mt-[14px] rounded-[22px] border border-[#EDEDEF] bg-white p-[20px] dark:border-[#2C2C2E] dark:bg-[#1C1C1E]">
      {children}
    </View>
  );
}

function Placeholder({ title }: { title: string }) {
  const { t } = useTranslation();

  return (
    <ProgressCard>
      <Text className="text-[16px] font-semibold text-black dark:text-white">{title}</Text>
      <Text className="mt-[6px] text-[13px] text-[#8A8A90] dark:text-[#9A9AA0]">
        {t("progress.comingSoon")}
      </Text>
    </ProgressCard>
  );
}

export default function Progress() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const theme = useThemeColors();
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState<TabKey>("weight");
  const [logOpen, setLogOpen] = useState(false);

  const { data, isPending, isError, refetch } = useProgress(PROGRESS_DAYS);

  // Tab ini tetap hidup di belakang tab lain, jadi tarik ulang data tiap kali dibuka
  // (mis. setelah mencatat makanan). Fokus pertama dilewati karena query sudah jalan sendiri.
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      refetch();
    }, [refetch]),
  );

  const weightPoints: WeightPoint[] = (data?.weight ?? []).map((p) => ({
    label: formatDay(p.date, i18n.language),
    value: p.value,
  }));

  return (
    <View
      collapsable={false}
      className="flex-1 bg-[#FEFDFD] dark:bg-[#0B0B0C]"
      style={{ paddingTop: insets.top }}
    >
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + BottomTabInset + 28 }}
      >
        <Text className="mx-[22px] mt-[10px] text-[26px] font-bold tracking-[-0.6px] text-black dark:text-white">
          {t("progress.title")}
        </Text>

        <SegmentedTabs value={tab} onChange={setTab} />

        {tab === "weight" && isPending ? (
          <View className="mt-[60px] items-center">
            <ActivityIndicator color={theme.text} />
          </View>
        ) : null}

        {tab === "weight" && isError ? (
          <ProgressCard>
            <Text className="text-[16px] font-semibold text-black dark:text-white">
              {t("progress.loadError")}
            </Text>
            <Pressable onPress={() => refetch()} className="mt-[10px]">
              <Text className="text-[14px] font-medium text-[#8A8A90] dark:text-[#9A9AA0]">
                {t("progress.retry")}
              </Text>
            </Pressable>
          </ProgressCard>
        ) : null}

        {tab === "weight" && data ? (
          <>
            <WeightTrendCard
              points={weightPoints}
              periodLabel={t("progress.vsDays", { count: PROGRESS_DAYS })}
              onLogPress={() => setLogOpen(true)}
            />
            <ConsistencyCard days={data.consistency.map((d) => d.status)} />
            <StreakCalendarCard
              loggedDates={data.loggedDates}
              today={data.today}
              streak={data.streak}
            />
          </>
        ) : null}
        {tab === "calories" ? <Placeholder title={t("progress.tabs.calories")} /> : null}
        {tab === "macros" ? <Placeholder title={t("progress.tabs.macros")} /> : null}
      </ScrollView>

      <LogWeightModal visible={logOpen} onClose={() => setLogOpen(false)} />
    </View>
  );
}