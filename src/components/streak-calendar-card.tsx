import { Ionicons } from "@react-native-vector-icons/ionicons/static";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { useThemeColors } from "@/lib/theme";

const DAY_MS = 24 * 60 * 60 * 1000;

const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/**
 * Jumlah hari berturut-turut yang ada log, dihitung mundur dari hari ini.
 * Kalau hari ini belum ada log, streak belum putus — hitungan mulai dari kemarin.
 * Bisa dipakai juga untuk menggantikan `const streak = 0` di home.tsx.
 */
export function computeStreak(loggedDates: string[], now = new Date()): number {
  const logged = new Set(loggedDates);
  let cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!logged.has(isoDate(cursor))) cursor = addDays(cursor, -1);

  let streak = 0;
  while (logged.has(isoDate(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Data sementara (14 hari terakhir ada log) — diganti data asli dari API di langkah 6. */
const MOCK_LOGGED: string[] = Array.from({ length: 14 }, (_, i) =>
  isoDate(new Date(Date.now() - i * DAY_MS)),
);

/** Geser string `YYYY-MM-DD` sebanyak n hari, tanpa terpengaruh zona waktu perangkat. */
const shiftIso = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export function StreakCalendarCard({
  loggedDates = MOCK_LOGGED,
  streak,
  today: todayProp,
}: {
  /** Tanggal lokal `YYYY-MM-DD` yang punya minimal satu meal. */
  loggedDates?: string[];
  streak?: number;
  /** "Hari ini" menurut zona waktu user dari server. Kalau kosong, pakai jam perangkat. */
  today?: string;
}) {
  const theme = useThemeColors();
  const { t } = useTranslation();

  // Huruf hari, urut Senin–Minggu, mengikuti bahasa aplikasi.
  const weekdays = t("progress.streak.weekdays", { returnObjects: true }) as unknown as string[];

  const today = todayProp ?? isoDate(new Date());
  const logged = new Set(loggedDates);
  const count = streak ?? computeStreak(loggedDates, new Date(`${today}T00:00:00`));

  // Minggu berjalan, mulai Senin. Hari dalam seminggu dibaca dari string tanggal (UTC),
  // supaya hasilnya sama di perangkat dengan zona waktu apa pun.
  const mondayOffset = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7;
  const week = Array.from({ length: 7 }, (_, i) => shiftIso(today, i - mondayOffset));

  return (
    <View className="mx-[22px] mt-[14px] rounded-[22px] border border-[#EDEDEF] bg-white p-[20px] dark:border-[#2C2C2E] dark:bg-[#1C1C1E]">
      <View className="flex-row items-center justify-between">
        <Text className="text-[16px] font-semibold text-black dark:text-white">
          {t("progress.streak.title")}
        </Text>
        <Text className="text-[13px] text-[#8A8A90] dark:text-[#9A9AA0]">
          {t("progress.streak.days", { count })}
        </Text>
      </View>

      <View className="mt-[18px] flex-row justify-between">
        {week.map((key, i) => {
          const isLogged = logged.has(key);
          const isToday = key === today;
          const isFuture = key > today;

          return (
            <View key={key} className="items-center" style={{ width: 36 }}>
              <Text className="text-[12px] font-medium text-[#8A8A90] dark:text-[#9A9AA0]">
                {weekdays[i]}
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
          );
        })}
      </View>
    </View>
  );
}