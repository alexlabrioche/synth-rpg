import type { CapabilityIconId } from "./icons";

export interface CharacterStats {
  complexity: number;
  chaos: number;
  discipline: number;
  percussiveness: number;
  expressivity: number;
  spatiality: number;
}

export interface Character {
  id: string;
  name: string;
  archetype: string;
  traits: string[];
  stats: CharacterStats;
  capabilityIconIds: CapabilityIconId[];
  originRolls: {
    sides: number;
    value: number;
  }[];
  description: string;
}
