import type { CharacterStats } from "@synth-rpg/types";
import { GameEventKind } from "@synth-rpg/types";
import { clamp } from "../utils/clamp";

const cloneStats = (stats: CharacterStats): CharacterStats => ({ ...stats });

const applyDelta = (
  stats: CharacterStats,
  delta: Partial<CharacterStats>
): CharacterStats => {
  const next = cloneStats(stats);
  (Object.keys(delta) as (keyof CharacterStats)[]).forEach((key) => {
    const change = delta[key];
    if (typeof change === "number") {
      next[key] = clamp(next[key] + change);
    }
  });
  return next;
};

const getMagnitude = (roll: number) => {
  if (roll >= 18) return 3;
  if (roll >= 14) return 2;
  if (roll >= 8) return 1;
  return 0;
};

const getSetback = (roll: number) => {
  if (roll <= 3) return 2;
  if (roll <= 7) return 1;
  return 0;
};

export const adjustStatsForEvent = (
  stats: CharacterStats,
  kind: GameEventKind,
  roll: number
): CharacterStats => {
  const magnitude = getMagnitude(roll);
  const setback = getSetback(roll);

  switch (kind) {
    case GameEventKind.Opportunity:
      return applyDelta(stats, {
        expressivity: 1 + magnitude,
        stability: 1,
        spatiality: magnitude > 1 ? 1 : 0,
      });
    case GameEventKind.Boon:
      return applyDelta(stats, {
        density: 1 + magnitude,
        expressivity: 1,
        percussiveness: magnitude > 0 ? 1 : 0,
      });
    case GameEventKind.Complication:
      return applyDelta(stats, {
        stability: -(1 + setback),
        chaos: 1,
      });
    case GameEventKind.Mutation:
      return applyDelta(stats, {
        chaos: 1 + magnitude,
        stability: -1,
        density: magnitude > 1 ? 1 : 0,
      });
    case GameEventKind.Catastrophe:
      return applyDelta(stats, {
        stability: -(2 + setback),
        percussiveness: -1,
        expressivity: -1,
      });
    default:
      return stats;
  }
};
