import * as SecureStore from "expo-secure-store";
 
import i18next, { resolveLanguage, type LanguagePreference } from "@/lib/i18n";
 
const KEY = "language-preference";

export async function loadLanguagePreference(): Promise<LanguagePreference> {
    const stored = await SecureStore.getItemAsync(KEY)
    return stored === "en" || stored === "id" || stored === "system" ? stored : "system"
}

export async function saveLanguagePreference(preference: LanguagePreference) {
    await SecureStore.setItemAsync(KEY, preference)
}

export function applyLanguage(preference: LanguagePreference | null | undefined) {
    i18next.changeLanguage(resolveLanguage(preference))
}
