import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Lang } from "@synth-rpg/types";
import en from "./locales/en.json";
import fr from "./locales/fr.json";

type TranslationLeaf = string | number | boolean | null;
type TranslationValue = TranslationLeaf | TranslationTree;

export interface TranslationTree {
  [key: string]: TranslationValue;
}
export type TranslationBatch = Partial<Record<Lang, TranslationTree>>;

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, fallback?: string) => string;
  extend: (entries: TranslationBatch) => void;
}

const DEFAULT_LANG: Lang = "en";
const baseDictionaries: Record<Lang, TranslationTree> = {
  en: en as TranslationTree,
  fr: fr as TranslationTree,
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({
  children,
  initialLang = DEFAULT_LANG,
}: {
  children: ReactNode;
  initialLang?: Lang;
}) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [dictionaries, setDictionaries] = useState<
    Record<Lang, TranslationTree>
  >(() => ({
    en: structuredCloneTranslationTree(baseDictionaries.en),
    fr: structuredCloneTranslationTree(baseDictionaries.fr),
  }));

  const extend = useCallback((entries: TranslationBatch) => {
    if (!entries) {
      return;
    }

    setDictionaries((prev) => {
      let didMutate = false;
      const next = { ...prev };

      (
        Object.entries(entries) as [Lang, TranslationTree | undefined][]
      ).forEach(([entryLang, additions]) => {
        if (!additions) {
          return;
        }

        const current = next[entryLang] ?? {};
        const merged = deepMerge(current, additions);

        if (merged !== current) {
          didMutate = true;
          next[entryLang] = merged;
        }
      });

      return didMutate ? next : prev;
    });
  }, []);

  const translate = useCallback(
    (key: string, fallback?: string) => {
      const dictionary = dictionaries[lang];
      const value = getByPath(dictionary, key);
      if (typeof value === "string") {
        return value;
      }
      if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
      }
      return fallback ?? key;
    },
    [dictionaries, lang]
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang,
      t: translate,
      extend,
    }),
    [extend, lang, translate]
  );

  useEffect(() => {
    const persisted = readPersistedLang();
    if (persisted && persisted !== lang) {
      setLang(persisted);
    }

    if (typeof window === "undefined") {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== "lang") return;
      const next = event.newValue ? parseLang(event.newValue) : null;
      if (next && next !== lang) {
        setLang(next);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }

  return context;
}

function structuredCloneTranslationTree(
  tree: TranslationTree
): TranslationTree {
  return JSON.parse(JSON.stringify(tree)) as TranslationTree;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMerge(
  base: TranslationTree,
  patch: TranslationTree
): TranslationTree {
  const result: TranslationTree = { ...base };

  Object.entries(patch).forEach(([key, value]) => {
    const current = result[key];
    if (isRecord(value) && isRecord(current)) {
      result[key] = deepMerge(
        current as TranslationTree,
        value as TranslationTree
      );
    } else {
      result[key] = value as TranslationLeaf | TranslationTree;
    }
  });

  return result;
}

function getByPath(tree: TranslationTree, path: string): unknown {
  if (!path) {
    return undefined;
  }

  return path.split(".").reduce<unknown>((acc, segment) => {
    if (!isRecord(acc)) {
      return undefined;
    }

    return acc[segment];
  }, tree);
}

function readPersistedLang(): Lang | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem("lang");
    if (!raw) {
      return null;
    }
    const parsed = parseLang(raw);
    return parsed;
  } catch {
    return null;
  }
}

function parseLang(value: string): Lang | null {
  try {
    const parsed = JSON.parse(value);
    if (parsed === "en" || parsed === "fr") {
      return parsed;
    }
    if (value === "en" || value === "fr") {
      return value;
    }
    return null;
  } catch {
    return value === "en" || value === "fr" ? value : null;
  }
}
