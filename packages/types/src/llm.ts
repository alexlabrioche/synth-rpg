import { z } from "zod";
import { GameEventKind } from "./game";

const safeString = z.string().min(1).catch("");

export const GameEventLLMSchema = z.object({
  title: z.string(),
  kind: z.enum(GameEventKind),
  narrative: z.string(),
  tone: z.string(),
  instructions: z.union([z.string(), z.array(z.string())]),
});

export const SessionPreludeLLMSchema = z.object({
  title: safeString,
  narrative: safeString,
  tone: safeString,
  instructions: safeString,
});

export const CharacterLLMSchema = z.object({
  name: z.string(),
  archetype: z.string(),
  traits: z.array(z.string()).min(1),
  description: z.string(),
});

export type GameEventLLMOutput = z.infer<typeof GameEventLLMSchema>;
export type SessionPreludeLLMOutput = z.infer<typeof SessionPreludeLLMSchema>;
export type CharacterLLMOutput = z.infer<typeof CharacterLLMSchema>;
