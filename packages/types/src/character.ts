import { z } from "zod";
import { capabilitySchema } from "./capabilities";

const statSchema = z.number().int().min(0).max(10);

export const characterStatsSchema = z.object({
  density: statSchema,
  chaos: statSchema,
  stability: statSchema,
  percussiveness: statSchema,
  expressivity: statSchema,
  spatiality: statSchema,
});

export const characterSchema = z.object({
  id: z.string(),
  name: z.string(),
  archetype: z.string(),
  traits: z.array(z.string()),
  stats: characterStatsSchema,
  capabilities: z.array(capabilitySchema),
  description: z.string(),
});

export type CharacterStats = z.infer<typeof characterStatsSchema>;

export type Character = z.infer<typeof characterSchema>;
