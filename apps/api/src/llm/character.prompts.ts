import type { CharacterStats } from "@synth-rpg/types";

export const getStatsLines = (stats: CharacterStats) => `
complexity: ${stats.complexity}
chaos: ${stats.chaos}
discipline: ${stats.discipline}
percussiveness: ${stats.percussiveness}
expressivity: ${stats.expressivity}
spatiality: ${stats.spatiality}
`;

export const getSystemPrompt = () => `
You are a game master for a solo experimental music RPG.
You create characters that reflect the player's hardware capabilities and abstract stats.

Rules:
- Be concise.
- Avoid gear brands and model names.
- Avoid technical patch instructions.
- Focus on mood, tendencies, and personality related to sound.
`;

export const getUserPrompt = (
  capabilityLines: string,
  statsLines: string,
  roll: number
) => `
Capabilities:
${capabilityLines}

Stats:
${statsLines}

Dice roll: d${roll}.

Create a character that embodies these properties.
Return JSON fields: name, archetype, traits, description.
Keep everything short and evocative.
`;
