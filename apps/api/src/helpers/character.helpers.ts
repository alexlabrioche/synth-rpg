import type { CapabilityId, CharacterStats } from "@synth-rpg/types";
import { clamp } from "../utils/clamp";
import { rollDie } from "../utils/roll-die";

export function deriveBaseStats(ids: CapabilityId[]): CharacterStats {
  const s: CharacterStats = {
    density: 0,
    chaos: 0,
    stability: 0,
    percussiveness: 0,
    expressivity: 0,
    spatiality: 0,
  };

  ids.forEach((id) => {
    if (id.includes("OSC")) {
      s.density += 2;
    }
    if (id.includes("RANDOM")) {
      s.chaos += 2;
    }
    if (id.includes("SEQUENCER")) {
      s.stability += 2;
      s.percussiveness += 1;
    }
    if (id.includes("GRANULAR") || id.includes("DELAY")) {
      s.spatiality += 2;
    }
    if (id.includes("ENVELOPE") || id.includes("LFO")) {
      s.expressivity += 1;
    }
  });

  return s;
}

export function applyInitialVariance(base: CharacterStats): CharacterStats {
  return {
    density: clamp(base.density + rollDie(4)),
    chaos: clamp(base.chaos + rollDie(4)),
    stability: clamp(base.stability + rollDie(4)),
    percussiveness: clamp(base.percussiveness + rollDie(4)),
    expressivity: clamp(base.expressivity + rollDie(4)),
    spatiality: clamp(base.spatiality + rollDie(4)),
  };
}
