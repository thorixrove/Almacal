import * as Localization from "expo-localization";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
 
import en from "@/locales/en.json";
import id from "@/locales/id.json";

export type LanguagePreference = "en" | "id" | "system"


function resolveDeviceLanguage(): "en" | "id" {
    const tag = Localization.getLocales()[0]?.languageCode
    return tag === "id" ? "id" : "en"
}

export function resolveLanguage(preference: LanguagePreference | null | undefined): "en" | "id" {
    if (preference === "en" || preference === "id") return preference
    return resolveDeviceLanguage()
}

i18next.use(initReactI18next).init({
    resources: { en: { translation: en}, id: {translation: id }},
    lng: resolveDeviceLanguage(),
    fallbackLng: "en",
    interpolation: { escapeValue: false}
})

export default i18next