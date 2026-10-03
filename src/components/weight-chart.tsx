import { useState } from "react";
import { Text, View, type LayoutChangeEvent } from "react-native";
import Svg, {
    Circle,
    Defs,
    Line,
    LinearGradient,
    Path,
    Stop,
    Text as SvgText,
} from "react-native-svg";

import { useThemeColors } from "@/lib/theme";

export type WeightPoint = { label: string; value: number };

/** Data sementara — diganti data asli dari API di langkah 6. */
export const MOCK_WEIGHT: WeightPoint[] = [
    { label: "Apr 20", value: 63.4 },
    { label: "Apr 24", value: 64.8 },
    { label: "Apr 27", value: 64.3 },
    { label: "May 1", value: 66.2 },
    { label: "May 4", value: 66.1 },
    { label: "May 8", value: 67.4 },
    { label: "May 11", value: 67.7 },
    { label: "May 15", value: 68.3 },
    { label: "May 18", value: 68.5 },
];

const PAD = { left: 30, right: 46, top: 16, bottom: 26 };
const CHART_HEIGHT = 190;
const X_LABEL_COUNT = 5;


export default function WeightChart({ points, unit = "kg" }: { points: WeightPoint[]; unit?: string }) {
    const theme = useThemeColors()
    const [width, setWidth] = useState(0)

    const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)

    if (points.length < 2) {
        return (
            <View className="mt-[16px] items-center rounded-[16px] bg-[#F3F3F7] px-[16px] py-[28px] dark:bg-[#2C2C2E]">
                <Text className="text-center text-[14px] text-[#6E6E78] dark:text-[#9A9AA0]">
                    Catat berat badan minimal 2 kali untuk malihat grafik
                </Text>
            </View>
        )
    }


    const values = points.map((p) => p.value)
    const yMin = Math.floor(Math.min(...values) - 1)
    const yMax = Math.ceil(Math.max(...values) + 1)
    const yMid = Math.round((yMin - yMax) / 2)

    const innerW = Math.max(0, width - PAD.left - PAD.right)
    const innerH = CHART_HEIGHT - PAD.bottom

    const x = (i: number) => PAD.left + (i / (points.length - 1)) * innerW
    const y = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin)) * innerH

    const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)} ${y(p.value)}`).join(" ");
    const baseY = PAD.top + innerH;
    const area = `${line} L${x(points.length - 1)} ${baseY} L${x(0)} ${baseY} Z`;

    const last = points[points.length - 1]
    const lastX = x(points.length - 1)
    const lastY = y(last.value)

    const count = Math.min(X_LABEL_COUNT, points.length)
    const labelIdx = Array.from({ length: count }, (_, i) =>
        Math.round((i * (points.length - 1)) / (count - 1)),
    )


    return (
        <View className="mt-[16px]" style={{ height: CHART_HEIGHT }} onLayout={onLayout}>
            {width > 0 ? (
                <>
                    <Svg width={width} height={CHART_HEIGHT}>
                        <Defs>
                            <LinearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0" stopColor={theme.text} stopOpacity={0.14} />
                                <Stop offset="1" stopColor={theme.text} stopOpacity={0} />
                            </LinearGradient>
                        </Defs>

                        {[yMin, yMid, yMax].map((tick) => (
                            <SvgText
                                key={tick}
                                x={0}
                                y={y(tick) + 4}
                                fontSize={12}
                                fill={theme.subtext}
                            >
                                {tick}
                            </SvgText>
                        ))}

                        {[yMin, yMid, yMax].map((tick) => (
                            <Line
                                key={`g-${tick}`}
                                x1={PAD.left}
                                x2={PAD.left + innerW}
                                y1={y(tick)}
                                y2={y(tick)}
                                stroke={theme.border}
                                strokeWidth={1}
                            />
                        ))}

                        <Path d={area} fill="url(#weightFill)" />
                        <Path
                            d={line}
                            stroke={theme.text}
                            strokeWidth={2}
                            fill="none"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                        />

                        {points.map((p, i) => (
                            <Circle key={i} cx={x(i)} cy={y(p.value)} r={2.5} fill={theme.text} />
                        ))}

                        <Circle cx={lastX} cy={lastY} r={5} fill={theme.cardBg} stroke={theme.text} strokeWidth={2} />

                        {labelIdx.map((idx, n) => (
                            <SvgText
                                key={idx}
                                x={x(idx)}
                                y={CHART_HEIGHT - 6}
                                fontSize={11}
                                fill={theme.subtext}
                                textAnchor={n === 0 ? "start" : n === labelIdx.length - 1 ? "end" : "middle"}
                            >
                                {points[idx].label}
                            </SvgText>
                        ))}
                    </Svg>

                    <View
                        pointerEvents="none"
                        style={{ position: "absolute", left: lastX + 10, top: lastY - 14 }}
                    >
                        <Text className="text-[14px] font-bold text-black dark:text-white">
                            {last.value.toFixed(1)}
                        </Text>
                        <Text className="text-[11px] text-[#8A8A90] dark:text-[#9A9AA0]">{unit}</Text>
                    </View>
                </>
            ) : null}
        </View>
    )
}

export function WeightTrendCard({
    points = MOCK_WEIGHT,
    periodLabel = "vs last 30 days",
}: {
    points?: WeightPoint[]
    periodLabel?: string
}) {
    const delta = points.length >= 2 ? points[points.length - 1].value - points[0].value : 0
    const sign = delta > 0 ? "+" : delta < 0 ? "-" : ""

    return (
        <View className="mx-[22px] mt-[14px] rounded-[22px] border border-[#EDEDEF] bg-white p-[20px] dark:border-[#2C2C2E] dark:bg-[#1C1C1E]">
            <Text className="text-[16px] font-semibold text-black dark:text-white">Weight Trend</Text>
            <Text className="mt-[10px] text-[22px] font-bold tracking-[-0.4px] text-black dark:text-white">
                {sign}
                {Math.abs(delta).toFixed(1)} kg
            </Text>
            <Text className="mt-[2px] text-[13px] text-[#8A8A90] dark:text-[#9A9AA0]">{periodLabel}</Text>

            <WeightChart points={points} />
        </View>
    )
}