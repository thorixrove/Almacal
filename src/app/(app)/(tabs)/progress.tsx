import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ConsistencyCard } from "@/components/consistency-card";
import { StreakCalenderCard } from "@/components/streak-calendar-card";
import { WeightTrendCard } from "@/components/weight-chart";
import { BottomTabInset } from "@/constants/theme";

const TABS = [
    { key: "weight", label: "Weight" },
    { key: "calories", label: "Calories" },
    { key: "macros", label: "Macros" },
] as const

type TabKey = (typeof TABS)[number]["key"]

function SegmentedTabs({
    value,
    onChange,
}: {
    value: TabKey
    onChange: (key: TabKey) => void
}) {
    return (
        <View className="mx-[22px] mt-[18px] flex-row rounded-full bg-[#F3F3F7] p-[4px] dark:bg-[#1C1C1E]">
            {TABS.map((tab) => {
                const active = tab.key === value;
                return (
                    <Pressable
                        key={tab.key}
                        onPress={() => onChange(tab.key)}
                        className={`flex-1 items-center rounded-full py-[10px] ${active ? "bg-white dark:bg-[#2C2C2E]" : ""
                            }`}
                    >
                        <Text
                            className={`text-[14px] ${active
                                    ? "font-semibold text-black dark:text-white"
                                    : "font-medium text-[#8A8A90] dark:text-[#9A9AA0]"
                                }`}
                        >
                            {tab.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    )
}

export function ProgressCard({ children}: { children: React.ReactNode}) {
    return(
        <View className="mx-[22px] mt-[14px] rounded-[22px] border border-[#EDEDEF] bg-white p-[20px] dark:border-[#2C2C2E] dark:bg-[#1C1C1E]">
            {children}
        </View>
    )
}

function Placeholder({ title}: { title: string}) {
    return (
        <ProgressCard>
            <Text className="text-[16px] font-semibold text-black dark:text-white">{title}</Text>
            <Text className="mt-[6px] text-[13px] text-[#8A8A90] dark:text-[#9A9AA0]">
                Segera diisi di langkah berikutnya.
            </Text>
        </ProgressCard>
    )
}

export default function Progress() {
    const insets = useSafeAreaInsets()
    const { colorScheme} = useColorScheme()
    const [tab, setTab] = useState<TabKey>("weight")

    return(
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
          Progress
        </Text>
 
        <SegmentedTabs value={tab} onChange={setTab} />
 
        {tab === "weight" ? (
          <>
            <WeightTrendCard />
            <ConsistencyCard />
            <StreakCalenderCard />
          </>
        ) : null}
        {tab === "calories" ? <Placeholder title="Calories" /> : null}
        {tab === "macros" ? <Placeholder title="Macros" /> : null}
      </ScrollView>
    </View>
    )
}



