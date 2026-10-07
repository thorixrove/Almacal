import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { MACROS } from "@/constants/macros";
import { useThemeColors } from "@/lib/theme";

export type DailyMacros = {
  date: string;
  logged: boolean;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type MacroTargets = {
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
};

// Key di MACROS -> nama field di data harian dan target.
const FIELD = { protein: "proteinG", carbs: "carbsG", fat: "fatG" } as const;

export function MacrosCard({
  daily,
  targets,
  days = 7,
}: {
  /** Entri harian urut lama → baru (dari `data.daily`). */
  daily: DailyMacros[];
  targets: MacroTargets;
  /** Jumlah hari terakhir yang dirata-ratakan. */
  days?: number;
}) {
  const theme = useThemeColors();
  const { t, i18n } = useTranslation();

  // Rata-rata hanya dari hari yang ada log, supaya hari kosong tidak menurunkan angka.
  const tracked = daily.slice(-days).filter((d) => d.logged);
  const average = (field: (typeof FIELD)[keyof typeof FIELD]) =>
    tracked.length ? Math.round(tracked.reduce((sum, d) => sum + d[field], 0) / tracked.length) : 0;

  const format = (n: number) => n.toLocaleString(i18n.language);

  return (
    <View className="mx-[22px] mt-[14px] rounded-[22px] border border-[#EDEDEF] bg-white p-[20px] dark:border-[#2C2C2E] dark:bg-[#1C1C1E]">
      <Text className="text-[16px] font-semibold text-black dark:text-white">
        {t("progress.macros.title")}
      </Text>
      <Text className="mt-[2px] text-[13px] text-[#8A8A90] dark:text-[#9A9AA0]">
        {t("progress.macros.avg", { count: days })}
      </Text>

      {tracked.length === 0 ? (
        <View className="mt-[16px] items-center rounded-[16px] bg-[#F3F3F7] px-[16px] py-[28px] dark:bg-[#2C2C2E]">
          <Text className="text-center text-[14px] text-[#6E6E78] dark:text-[#9A9AA0]">
            {t("progress.macros.empty")}
          </Text>
        </View>
      ) : (
        <View style={{ marginTop: 18, gap: 18 }}>
          {MACROS.map((macro) => {
            const field = FIELD[macro.key];
            const avg = average(field);
            const goal = targets[field];
            const ratio = goal ? Math.min(avg / goal, 1) : 0;

            return (
              <View key={macro.key}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: macro.color,
                        marginRight: 8,
                      }}
                    />
                    <Text className="text-[15px] font-semibold text-black dark:text-white">
                      {t(`progress.macros.names.${macro.key}`)}
                    </Text>
                  </View>
                  <Text className="text-[14px] text-[#8A8A90] dark:text-[#9A9AA0]">
                    {goal
                      ? t("progress.macros.value", { avg: format(avg), target: format(goal) })
                      : t("progress.macros.valueNoTarget", { avg: format(avg) })}
                  </Text>
                </View>

                {goal ? (
                  <View
                    style={{
                      marginTop: 8,
                      height: 10,
                      borderRadius: 5,
                      overflow: "hidden",
                      backgroundColor: theme.border,
                    }}
                  >
                    <View
                      style={{
                        width: `${Math.round(ratio * 100)}%`,
                        height: "100%",
                        borderRadius: 5,
                        backgroundColor: macro.color,
                      }}
                    />
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}