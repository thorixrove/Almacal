import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View, type LayoutChangeEvent } from "react-native";
import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";

import { useThemeColors } from "@/lib/theme";

export type DailyCalories = { date: string; logged: boolean; calories: number };

// Harus sama dengan HIT_TOLERANCE di progress+api.ts supaya "on target" konsisten
// dengan kartu Consistency.
const HIT_TOLERANCE = 0.1;
const OVER_COLOR = "#F4685C";
const CHART_HEIGHT = 170;
const PAD = { top: 12, bottom: 28 };

export function CaloriesCard({
  daily,
  target,
  days = 7,
}: {
  /** Entri harian urut lama → baru (dari `data.daily`). */
  daily: DailyCalories[];
  /** Target kalori harian; null kalau belum diatur. */
  target: number | null;
  /** Jumlah hari terakhir yang ditampilkan. */
  days?: number;
}) {
  const theme = useThemeColors();
  const { t, i18n } = useTranslation();
  const [width, setWidth] = useState(0);

  const recent = daily.slice(-days);
  const tracked = recent.filter((d) => d.logged);
  const avg = tracked.length
    ? Math.round(tracked.reduce((sum, d) => sum + d.calories, 0) / tracked.length)
    : 0;
  const onTarget = target
    ? tracked.filter((d) => Math.abs(d.calories - target) <= target * HIT_TOLERANCE).length
    : 0;

  const weekdays = t("progress.streak.weekdays", { returnObjects: true }) as unknown as string[];
  const weekdayOf = (iso: string) => weekdays[(new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7];

  const format = (n: number) => n.toLocaleString(i18n.language);

  const innerH = CHART_HEIGHT - PAD.top - PAD.bottom;
  const maxValue = Math.max(target ?? 0, ...recent.map((d) => d.calories)) * 1.15 || 1;
  const baseY = PAD.top + innerH;
  const y = (v: number) => PAD.top + (1 - v / maxValue) * innerH;
  const slot = recent.length > 0 ? width / recent.length : 0;
  const barW = Math.min(28, slot * 0.5);

  const barColor = (d: DailyCalories) =>
    !d.logged
      ? theme.border
      : target && d.calories > target * (1 + HIT_TOLERANCE)
        ? OVER_COLOR
        : theme.text;

  return (
    <View className="mx-[22px] mt-[14px] rounded-[22px] border border-[#EDEDEF] bg-white p-[20px] dark:border-[#2C2C2E] dark:bg-[#1C1C1E]">
      <Text className="text-[16px] font-semibold text-black dark:text-white">
        {t("progress.calories.title")}
      </Text>

      <View className="mt-[10px] flex-row items-end">
        <Text className="text-[26px] font-bold text-black dark:text-white">{format(avg)}</Text>
        <Text className="mb-[4px] ml-[6px] text-[14px] text-[#8A8A90] dark:text-[#9A9AA0]">
          {t("camera.kcal")}
        </Text>
      </View>
      <Text className="mt-[2px] text-[13px] text-[#8A8A90] dark:text-[#9A9AA0]">
        {t("progress.calories.avg", { count: days })}
      </Text>

      {tracked.length === 0 ? (
        <View className="mt-[16px] items-center rounded-[16px] bg-[#F3F3F7] px-[16px] py-[28px] dark:bg-[#2C2C2E]">
          <Text className="text-center text-[14px] text-[#6E6E78] dark:text-[#9A9AA0]">
            {t("progress.calories.empty")}
          </Text>
        </View>
      ) : (
        <View
          className="mt-[16px]"
          style={{ height: CHART_HEIGHT }}
          onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        >
          {width > 0 ? (
            <Svg width={width} height={CHART_HEIGHT}>
              {target ? (
                <Line
                  x1={0}
                  x2={width}
                  y1={y(target)}
                  y2={y(target)}
                  stroke={theme.chevron}
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                />
              ) : null}

              {recent.map((d, i) => {
                const cx = slot * i + slot / 2;
                const h = d.logged ? Math.max(4, (d.calories / maxValue) * innerH) : 4;

                return (
                  <Fragment key={d.date}>
                    <Rect
                      x={cx - barW / 2}
                      y={baseY - h}
                      width={barW}
                      height={h}
                      rx={6}
                      fill={barColor(d)}
                    />
                    <SvgText
                      x={cx}
                      y={CHART_HEIGHT - 8}
                      fontSize={12}
                      fill={theme.subtext}
                      textAnchor="middle"
                    >
                      {weekdayOf(d.date)}
                    </SvgText>
                  </Fragment>
                );
              })}
            </Svg>
          ) : null}
        </View>
      )}

      {target ? (
        <View className="mt-[14px] flex-row items-center justify-between">
          <Text className="text-[13px] text-[#8A8A90] dark:text-[#9A9AA0]">
            {t("progress.calories.target", { value: format(target) })}
          </Text>
          <Text className="text-[13px] font-semibold text-black dark:text-white">
            {t("progress.calories.onTarget", { hit: onTarget, tracked: tracked.length })}
          </Text>
        </View>
      ) : null}
    </View>
  );
}