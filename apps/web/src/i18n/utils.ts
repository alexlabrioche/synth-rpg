import type { CAPABILITY_TRANSLATIONS } from "@synth-rpg/specs";
import type { Lang } from "@synth-rpg/types";
import type { TranslationBatch, TranslationTree } from "./provider";

type CapabilityTranslations = typeof CAPABILITY_TRANSLATIONS;

export function capabilityTranslationsToBatch(
  translations: CapabilityTranslations
): TranslationBatch {
  const batch: TranslationBatch = {};

  (Object.entries(translations) as [Lang, CapabilityTranslations[Lang]][]).forEach(
    ([lang, capabilityMap]) => {
      if (!capabilityMap) {
        return;
      }

      const subtree: TranslationTree = {
        capabilities: capabilityMap as TranslationTree,
      };

      batch[lang] = subtree;
    }
  );

  return batch;
}
