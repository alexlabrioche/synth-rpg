import type { CharacterStats } from "@synth-rpg/types";

/**
 * Formats stats into a fixed block so prompts stay consistent
 * across character creation and session events.
 */
export const formatStatsLines = (stats: CharacterStats) => `
density: ${stats.density}
chaos: ${stats.chaos}
stability: ${stats.stability}
percussiveness: ${stats.percussiveness}
expressivity: ${stats.expressivity}
spatiality: ${stats.spatiality}
`;
