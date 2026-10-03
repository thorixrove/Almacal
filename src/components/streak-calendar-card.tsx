import { Ionicons } from "@react-native-vector-icons/ionicons/static";
import { Text, View } from "react-native";

import { useThemeColors } from "@/lib/theme";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

const DAY_MS = 24 * 60 * 60 * 1000;

const isoDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export default function computeStreak(loggedDates: string[], now = new Date()): number {
    const logged = new Set(loggedDates)
    let cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    if (!logged.has(isoDate(cursor))) cursor = addDays(cursor, -1)

    let streak = 0
    while (logged.has(isoDate(cursor))) {
        streak += 1
        cursor = addDays(cursor, -1)
    }
    return streak
}

const MOCK_LOGGED: string[] = Array.from({ length: 14 }, (_, i) =>
    isoDate(new Date(Date.now() - i * DAY_MS)),
)

export function StreakCalenderCard({
    loggedDates = MOCK_LOGGED,
    streak,
}: {
    loggedDates?: string[];
    streak?: number;
}) {
    const theme = useThemeColors()
    const now = new Date()
    const today = isoDate(now)
    const logged = new Set(loggedDates)
    const count = streak ?? computeStreak(loggedDates, now)

    const mondayOffset = (now.getDay() + 6) % 7
    const week = Array.from({ length: 7 }, (_, i) => addDays(now, i - mondayOffset))

    return (
        <View className="mx-[22px] mt-[14px] rounded-[22px] border border-[#EDEDEF] bg-white p-[20px] dark:border-[#2C2C2E] dark:bg-[#1C1C1E]">
            <View className="flex-row items-center justify-between">
                <Text className="text-[16px] font-semibold text-black dark:text-white">Streak Calendar</Text>
                <Text className="text-[13px] text-[#8A8A90] dark:text-[#9A9AA0]">{count} Day Streak</Text>
            </View>

            <View className="mt-[18px] flex-row justify-between">
                {week.map((d, i) => {
                    const key = isoDate(d)
                    const isLogged = logged.has(key)
                    const isToday = key === today
                    const isFuture = key > today

                    return (
                        <View key={key} className="items-center" style={{ width: 36 }}>
                            <Text className="text-[12px] font-medium text-[#8A8A90] dark:text-[#9A9AA0]">
                                {WEEKDAYS[i]}
                            </Text>
                            <View
                                className="mt-[10px] items-center justify-center rounded-full"
                                style={{
                                    width: 32,
                                    height: 32,
                                    backgroundColor: isLogged ? theme.text : "transparent",
                                    borderWidth: isLogged ? 0 : 1.5,
                                    borderStyle: isFuture || isToday ? "solid" : "dashed",
                                    borderColor: isFuture ? theme.border : isToday ? theme.text : theme.chevron,
                                }}
                            >
                                {isLogged ? <Ionicons name="checkmark" size={16} color={theme.cardBg} /> : null}
                            </View>
                        </View>
                    )
                })}
            </View>
        </View>
    )
}