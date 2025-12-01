import { z } from "zod";
import { GameEventKind } from "./game";

const stringField = z.string();
const stringArrayField = z.array(stringField);

const gameEventKindValues = [
  GameEventKind.Opportunity,
  GameEventKind.Boon,
  GameEventKind.Complication,
  GameEventKind.Mutation,
  GameEventKind.Catastrophe,
] as const;

export const LLMTagSchema = z.object({
  type: stringField,
  value: stringField,
});

const tagsSchema = z.array(LLMTagSchema).optional();

export const LLMTelemetrySchema = z.object({
  model: stringField.optional(),
  templateVersion: stringField.optional(),
  source: stringField.optional(),
  latencyMs: z.number().int().nonnegative().optional(),
  warnings: stringArrayField.optional(),
});

const sessionContextGearSchema = z.object({
  name: stringField,
  role: stringField.optional(),
  description: stringField.optional(),
  capabilities: stringArrayField.optional(),
  traits: stringArrayField.optional(),
});

export const SessionContextSchema = z.object({
  goal: stringField.optional(),
  mood: stringField.optional(),
  focus: stringField.optional(),
  location: stringField.optional(),
  gear: z.array(sessionContextGearSchema).optional(),
  recentMoves: stringArrayField.optional(),
  capabilityTags: stringArrayField.optional(),
});

export const GameEventLLMSchema = z
  .object({
    title: stringField,
    narrative: stringField,
    gearStrategy: stringField,
    abstractPrompt: stringField,
    nextHook: stringField.optional(),
    sessionContext: SessionContextSchema.optional(),
    tags: tagsSchema,
    telemetry: LLMTelemetrySchema.partial(),
  })
  .passthrough();

export const SessionPreludeLLMSchema = z.object({
  title: stringField,
  narrative: stringField,
  tone: stringField,
  instructions: stringField,
});

export const CharacterLLMSchema = z.object({
  name: z.string(),
  archetype: z.string(),
  traits: z.array(z.string()).min(1),
  description: z.string(),
});

export type SessionContextLLM = z.infer<typeof SessionContextSchema>;
export type ResponseTag = z.infer<typeof LLMTagSchema>;
export type LLMTelemetry = z.infer<typeof LLMTelemetrySchema>;
export type GameEventLLMOutput = z.infer<typeof GameEventLLMSchema>;
export type SessionPreludeLLMOutput = z.infer<typeof SessionPreludeLLMSchema>;
export type CharacterLLMOutput = z.infer<typeof CharacterLLMSchema>;
