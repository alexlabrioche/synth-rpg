import type { CharacterStats, Capability } from "@synth-rpg/types";
import { CapabilityCategory } from "@synth-rpg/types";
import { clamp } from "../utils/clamp";
import { rollDie } from "../utils/roll-die";

type CapabilityLike = Pick<Capability, "slug" | "category">;

const slugIncludes = (capability: CapabilityLike, fragment: string) =>
  capability.slug.toLowerCase().includes(fragment);

export function deriveBaseStats(capabilities: CapabilityLike[]): CharacterStats {
  const s: CharacterStats = {
    density: 0,
    chaos: 0,
    stability: 0,
    percussiveness: 0,
    expressivity: 0,
    spatiality: 0,
  };

  capabilities.forEach((capability) => {
    if (
      capability.category === CapabilityCategory.Oscillator ||
      slugIncludes(capability, "vco") ||
      slugIncludes(capability, "osc")
    ) {
      s.density += 2;
    }

    if (
      slugIncludes(capability, "random") ||
      slugIncludes(capability, "noise")
    ) {
      s.chaos += 2;
    }

    if (
      slugIncludes(capability, "seq") ||
      slugIncludes(capability, "pattern") ||
      capability.category === CapabilityCategory.Sequencer
    ) {
      s.stability += 2;
      s.percussiveness += 1;
    }

    if (
      slugIncludes(capability, "granular") ||
      slugIncludes(capability, "delay") ||
      slugIncludes(capability, "reverb")
    ) {
      s.spatiality += 2;
    }

    if (
      slugIncludes(capability, "env") ||
      slugIncludes(capability, "envelope") ||
      slugIncludes(capability, "lfo")
    ) {
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
