import { CAPABILITY_ARRAY, CAPABILITY_TRANSLATIONS } from "@synth-rpg/specs";
import type { CapabilityId, Character, Lang } from "@synth-rpg/types";
import { callCharacterModel } from "../llm/character.model";
import { getSystemPrompt, getUserPrompt } from "../llm/character.prompts";
import {
  applyInitialVariance,
  deriveBaseStats,
} from "../helpers/character.helpers";
import { characterRepo } from "../repo/memory.repo";

interface GenerateCharacterInput {
  capabilityIds: CapabilityId[];
  lang: Lang;
}

export async function generateCharacter(
  input: GenerateCharacterInput
): Promise<Character> {
  const dictionary =
    CAPABILITY_TRANSLATIONS[input.lang] ?? CAPABILITY_TRANSLATIONS.en;

  const capabilities = CAPABILITY_ARRAY.filter((icon) =>
    input.capabilityIds.includes(icon.id)
  );

  if (capabilities.length === 0) {
    throw new Error("No valid capabilities were provided");
  }

  const baseStats = deriveBaseStats(capabilities);
  const stats = applyInitialVariance(baseStats);

  const capabilitySummaries = capabilities
    .map((capability) => {
      const translation = dictionary[capability.slug];
      const label = translation?.label ?? capability.slug;
      const description =
        translation?.description ?? capability.description ?? "";
      const descriptionPart = description ? `: ${description}` : "";
      return `- ${label}${descriptionPart}`;
    })
    .join("\n");

  const systemPrompt = getSystemPrompt({ lang: input.lang });
  const userPrompt = getUserPrompt({
    capabilitySummaries: capabilitySummaries,
    stats,
    lang: input.lang,
  });

  const llmOutput = await callCharacterModel({
    systemPrompt,
    userPrompt,
  });

  const character: Character = {
    id: crypto.randomUUID(),
    name: llmOutput.name,
    archetype: llmOutput.archetype,
    traits: llmOutput.traits,
    stats,
    description: llmOutput.description,
    capabilities,
  };

  return characterRepo.save(character);
}

export function getCharacterById(id: string) {
  return characterRepo.get(id);
}

export function listCharacters() {
  return characterRepo.getAll();
}
