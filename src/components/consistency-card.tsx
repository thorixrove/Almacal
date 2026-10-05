import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { useThemeColors } from "@/lib/theme";

/**
 * hit  = kalori hari itu masuk target
 * miss = ada log, tapi di luar target
 * none = belum ada data (hari belum lewat / tidak ada log)
 */
export type ConsistencyDay = "hit" | "miss" | "none";

/** Data sementara — diganti data asli dari API di langkah 6. */
export const MOCK_CONSISTENCY: ConsistencyDay[] = [
  ...Array.from({ length: 22 }, (): ConsistencyDay => "hit"),
  "miss",
  "hit",
  "miss",
  "none",
  "none",
  "none",
  "none",
  "none",
];

export function ConsistencyCard({ days = MOCK_CONSISTENCY }: { days?: ConsistencyDay[] }) {
  const theme = useThemeColors();
  const { t } = useTranslation();

  const hits = days.filter((d) => d === "hit").length;
  const tracked = days.filter((d) => d !== "none").length;
  const rate = tracked > 0 ? Math.round((hits / tracked) * 100) : 0;

  const barColor = (d: ConsistencyDay) =>
    d === "hit" ? theme.text : d === "miss" ? theme.chevron : theme.border;

  return (
    <View className="mx-[22px] mt-[14px] rounded-[22px] border border-[#EDEDEF] bg-white p-[20px] dark:border-[#2C2C2E] dark:bg-[#1C1C1E]">
      <View className="flex-row items-end justify-between">
        <View>
          <Text className="text-[14px] text-[#8A8A90] dark:text-[#9A9AA0]">
            {t("progress.consistency.title")}
          </Text>
          <Text className="mt-[6px] text-[16px] font-semibold text-black dark:text-white">
            {t("progress.consistency.hitRate")}
          </Text>
        </View>
        {/* Tanpa letter-spacing negatif: di Android itu bisa memotong karakter "%" di ujung kanan. */}
        <Text
          className="text-[34px] font-bold text-black dark:text-white"
          style={{ flexShrink: 0, paddingRight: 2 }}
        >
          {`${rate}%`}
        </Text>
      </View>

      <View className="mt-[18px] h-[36px] flex-row" style={{ gap: 3 }}>
        {days.map((d, i) => (
          <View
            key={i}
            className="flex-1 rounded-full"
            style={{ backgroundColor: barColor(d) }}
          />
        ))}
      </View>
    </View>
  );
}