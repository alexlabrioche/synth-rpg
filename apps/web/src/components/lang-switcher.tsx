import type { Lang } from "@synth-rpg/types";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { useLocalStorage } from "@/components/use-local-storage";

const LANG_OPTIONS: Array<{ value: Lang; label: string }> = [
  { value: "en", label: "EN" },
  { value: "fr", label: "FR" },
];

export function LangSwitcher() {
  const { lang, setLang } = useI18n();
  const [, setPersistedLang] = useLocalStorage<Lang>("lang", lang);

  const handleSelect = (nextLang: Lang) => {
    setLang(nextLang);
    setPersistedLang(nextLang);
  };

  return (
    <div className="inline-flex items-center gap-2" role="group" aria-label="Language selector">
      {LANG_OPTIONS.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant={lang === option.value ? "default" : "outline"}
          size="sm"
          onClick={() => handleSelect(option.value)}
          aria-pressed={lang === option.value}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
