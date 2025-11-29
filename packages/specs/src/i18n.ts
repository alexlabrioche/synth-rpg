import type { Lang } from "@synth-rpg/types";
import en from "../i18n/en.json";
import fr from "../i18n/fr.json";

export interface CapabilityTranslationEntry {
  label: string;
  description: string;
}

type CapabilityDictionary = Record<string, CapabilityTranslationEntry>;
type LocaleFileShape = { capabilities: CapabilityDictionary };

const enLocale = en as LocaleFileShape;
const frLocale = fr as LocaleFileShape;

export const CAPABILITY_TRANSLATIONS: Record<Lang, CapabilityDictionary> = {
  en: enLocale.capabilities,
  fr: frLocale.capabilities,
};

export function getCapabilityTranslation(slug: string, lang: Lang) {
  return CAPABILITY_TRANSLATIONS[lang][slug];
}
