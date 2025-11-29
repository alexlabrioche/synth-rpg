import { randomUUID } from "crypto";
import { CAPABILITY_ICONS } from "@synth-rpg/specs";
import type {
  CapabilityIconId,
  Character,
  CharacterStats,
} from "@synth-rpg/types";
import { callCharacterModel } from "../llm/character.model";
import { rollDie } from "../utils/roll-die";
import {
  getStatsLines,
  getSystemPrompt,
  getUserPrompt,
} from "../llm/character.prompts";

export function deriveStatsFromCapabilities(
  ids: CapabilityIconId[]
): CharacterStats {
  const base: CharacterStats = {
    complexity: 0,
    chaos: 0,
    discipline: 0,
    percussiveness: 0,
    expressivity: 0,
    spatiality: 0,
  };

  ids.forEach((id) => {
    if (id.includes("OSC")) base.complexity += 2;
    if (id.includes("RANDOM")) base.chaos += 3;
    if (id.includes("SEQUENCER")) {
      base.discipline += 2;
      base.percussiveness += 1;
    }
    if (id.includes("GRANULAR") || id.includes("DELAY")) base.spatiality += 2;
    if (id.includes("ENVELOPE") || id.includes("LFO")) base.expressivity += 1;
  });

  const clamp = (n: number) => Math.max(0, Math.min(10, n));

  return {
    complexity: clamp(base.complexity),
    chaos: clamp(base.chaos),
    discipline: clamp(base.discipline),
    percussiveness: clamp(base.percussiveness),
    expressivity: clamp(base.expressivity),
    spatiality: clamp(base.spatiality),
  };
}

interface GenerateCharacterInput {
  capabilityIconIds: CapabilityIconId[];
}

export async function generateCharacter(
  input: GenerateCharacterInput,
  log: (msg: string, meta?: unknown) => void = () => {}
): Promise<Character> {
  const { capabilityIconIds } = input;

  const roll = rollDie();
  const stats = deriveStatsFromCapabilities(capabilityIconIds);

  const capabilityIconSummaries = CAPABILITY_ICONS.filter((icon) =>
    capabilityIconIds.includes(icon.id)
  ).map((icon) => ({
    id: icon.id,
    label: icon.label,
    description: icon.description,
  }));

  const capabilityLines = capabilityIconSummaries
    .map((c) => `- ${c.label}: ${c.description}`)
    .join("\n");

  const systemPrompt = getSystemPrompt();
  const statsLines = getStatsLines(stats);
  const userPrompt = getUserPrompt(capabilityLines, statsLines, roll);

  log("Calling character model", { roll, stats, capabilityIconIds });

  const llmOutput = await callCharacterModel({
    systemPrompt,
    userPrompt,
  });

  const character: Character = {
    id: randomUUID(),
    name: llmOutput.name,
    archetype: llmOutput.archetype,
    traits: llmOutput.traits,
    stats,
    capabilityIconIds,
    originRolls: [{ sides: 20, value: roll }],
    description: llmOutput.description,
  };

  return character;
}
