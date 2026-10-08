import { Ionicons } from "@react-native-vector-icons/ionicons/static";
import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { FoodFilterSheet } from "@/components/food-filter-sheet";
import { MealDetailSheet, type DetailMeal } from "@/components/meal-detail-sheet";
import {
  DEFAULT_FOOD_FILTERS,
  countActiveFilters,
  useDeleteMeal,
  useFoods,
  useProfile,
  type FoodCategory,
  type FoodFilters,
  type FoodItem,
} from "@/lib/api";
import { proxyImage } from "@/lib/image-proxy";
import { useThemeColors } from "@/lib/theme";

const TAB_BAR = Platform.select({ ios: 49, default: 80 });
const THUMB = 56;
const CHIP_HEIGHT = 36;

// `null` = chip "All" (tanpa filter kategori).
const CATEGORIES: { key: FoodCategory | null; label: string }[] = [
  { key: null, label: "All" },
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "snacks", label: "Snacks" },
];

const thumbnail = (url: string) => `${proxyImage(url)}?tr=w-${THUMB * 3},h-${THUMB * 3},q-70`;

/** Nilai yang baru ikut berubah setelah `delay` ms tanpa perubahan — supaya tidak fetch tiap huruf. */
function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function Food() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const theme = useThemeColors();
  const { t } = useTranslation();
  const isDark = colorScheme === "dark";

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<FoodCategory | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FoodFilters>(DEFAULT_FOOD_FILTERS)
  const [filterOpen, setFilterOpen] = useState(false)

  const query = useDebounced(search);
  const { data, isPending, isError, isFetching, refetch } = useFoods(query, category ?? undefined, filters);
  const { data: profile } = useProfile();
  const deleteMeal = useDeleteMeal();

  // Tab tetap ter-mount di belakang, jadi scan baru tidak akan muncul tanpa refetch saat tab dibuka.
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const selected = data?.find((f) => f.id === selectedId) ?? null;
  const detail: DetailMeal | null = selected
    ? {
      id: selected.id,
      imageUrl: selected.imageUrl,
      status: "completed",
      name: selected.name,
      calories: selected.calories ?? 0,
      protein: selected.proteinG ?? 0,
      carbs: selected.carbsG ?? 0,
      fat: selected.fatG ?? 0,
      errorReason: null,
      loggedAt: new Date(selected.loggedAt),
    }
    : null;

  const activeFilters = countActiveFilters(filters);
  const filtering = !!query.trim() || category !== null || activeFilters > 0;

  return (
    <View
      collapsable={false}
      className="flex-1 bg-[#FEFDFD] dark:bg-[#0B0B0C]"
      style={{ paddingTop: insets.top }}
    >
      <StatusBar style={isDark ? "light" : "dark"} />
      <View className="mt-[10px] flex-row items-center px-[22px]">
        <Text className="flex-1 text-[26px] font-bold tracking-[-0.6px] text-black dark:text-white">
          {t("foods.title", "Foods")}
        </Text>
        <Pressable onPress={() => setFilterOpen(true)} hitSlop={10} className="active:opacity-60">
          <Ionicons name="options-outline" size={22} color={theme.icon} />
          {/* Titik penanda: ada filter (urutan/tanggal/protein/kalori) yang aktif. */}
          {activeFilters > 0 ? (
            <View className="absolute -right-[3px] -top-[3px] h-[9px] w-[9px] rounded-full bg-[#F0524A]" />
          ) : null}
        </Pressable>
      </View>

      <View className="mx-[22px] mt-[16px] h-[46px] flex-row items-center rounded-[16px] border border-[#EDEDEF] bg-white px-[14px] dark:border-[#2C2C2E] dark:bg-[#1C1C1E]">
        <Ionicons name="search" size={18} color={theme.subtext} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t("foods.searchPlaceholder", "Search foods...")}
          placeholderTextColor={theme.subtext}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          className="ml-[10px] flex-1 text-[15px] text-black dark:text-white"
        />
        {isFetching && !isPending ? (
          <ActivityIndicator size="small" color={theme.subtext} />
        ) : search ? (
          <Pressable onPress={() => setSearch("")} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={theme.subtext} />
          </Pressable>
        ) : null}
      </View>

      {/* Tinggi dikunci: ScrollView horizontal di dalam kolom flex bisa terjepit dan memotong chip. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={{ flexGrow: 0, flexShrink: 0, height: CHIP_HEIGHT, marginTop: 14 }}
        contentContainerStyle={{ paddingHorizontal: 22, gap: 8, alignItems: "center" }}
      >
        {CATEGORIES.map((c) => {
          const active = c.key === category;
          return (
            <Pressable
              key={c.label}
              onPress={() => setCategory(c.key)}
              style={{ height: CHIP_HEIGHT }}
              className={`justify-center rounded-full border px-[16px] active:opacity-70 ${active
                ? "border-black bg-black dark:border-white dark:bg-white"
                : "border-[#EDEDEF] bg-white dark:border-[#2C2C2E] dark:bg-[#1C1C1E]"
                }`}
            >
              <Text
                className={`text-[14px] font-medium ${active ? "text-white dark:text-black" : "text-black dark:text-white"
                  }`}
              >
                {t(`foods.categories.${c.key ?? "all"}`, c.label)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={theme.subtext} />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-[40px]">
          <Text className="text-center text-[15px] leading-[20px] text-[#6E6E78] dark:text-[#9A9AA0]">
            {t("foods.loadError", "We couldn't load your foods.")}
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="mt-[16px] h-[44px] items-center justify-center rounded-full bg-black px-[26px] active:opacity-90 dark:bg-white"
          >
            <Text className="text-[15px] font-semibold text-white dark:text-black">
              {t("foods.retry", "Retry")}
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          style={{ marginTop: 6 }}
          contentContainerStyle={{
            paddingHorizontal: 22,
            paddingBottom: insets.bottom + TAB_BAR + 28,
          }}
          renderItem={({ item }) => <FoodRow food={item} onPress={() => setSelectedId(item.id)} />}
          ListEmptyComponent={
            <View className="mt-[40px] items-center rounded-[20px] bg-[#F3F3F7] px-[18px] py-[24px] dark:bg-[#1C1C1E]">
              <View className="h-[46px] w-[46px] items-center justify-center rounded-full bg-white dark:bg-[#2C2C2E]">
                <Ionicons name="search" size={20} color="#B4B4BC" />
              </View>
              <Text className="mt-[14px] text-center text-[15px] leading-[20px] text-[#6E6E78] dark:text-[#9A9AA0]">
                {filtering
                  ? t("foods.noResults", "No scanned foods match your search.")
                  : t("foods.empty", "No scanned foods yet. Scan a meal and it will show up here.")}
              </Text>
            </View>
          }
        />
      )}

      <FoodFilterSheet
      visible={filterOpen}
      filters={filters}
      onApply={(next) => {
        setFilters(next)
        setFilterOpen(false)
      }}
      onClose={() => setFilterOpen(false)}
      />

      <MealDetailSheet
        meal={detail}
        onClose={() => setSelectedId(null)}
        deleting={deleteMeal.isPending}
        dailyTarget={{
          protein: profile?.proteinG ?? 0,
          carbs: profile?.carbsG ?? 0,
          fat: profile?.fatG ?? 0,
        }}
        onDelete={(id) => deleteMeal.mutate(id, { onSuccess: () => setSelectedId(null) })}
      />
    </View>
  );
}

function FoodRow({ food, onPress }: { food: FoodItem; onPress: () => void }) {
  const theme = useThemeColors();

  return (
    <Pressable onPress={onPress} className="flex-row items-center py-[12px] active:opacity-60">
      <View
        className="items-center justify-center overflow-hidden rounded-full"
        style={{ width: THUMB, height: THUMB, backgroundColor: theme.cardBg }}
      >
        {food.imageUrl ? (
          <Image
            source={{ uri: thumbnail(food.imageUrl) }}
            style={{ width: THUMB, height: THUMB }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <Ionicons name="restaurant-outline" size={22} color={theme.chevron} />
        )}
      </View>

      <View className="ml-[14px] flex-1">
        <Text numberOfLines={1} className="text-[16px] font-semibold text-black dark:text-white">
          {food.name}
        </Text>
        <Text className="mt-[3px] text-[13px] text-[#8A8A90] dark:text-[#9A9AA0]">
          {food.calories ?? 0} Cal • {food.proteinG ?? 0}g Protein
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={theme.chevron} />
    </Pressable>
  );
}