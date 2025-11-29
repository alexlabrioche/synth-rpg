import { GameEventKind } from "@synth-rpg/types";
import * as z from "zod";

const safeString = z.string().min(1).catch("");

export const GameEventLLMSchema = z.object({
  title: safeString,
  kind: z.enum(GameEventKind).catch(GameEventKind.Opportunity),
  instructions: safeString,
  constraints: z
    .union([z.array(z.string()), z.string()])
    .optional()
    .default([]),
  description: safeString,
});

export const SessionPreludeLLMSchema = z.object({
  title: safeString,
  invitation: safeString,
  scene: safeString,
  lore: safeString,
  tone: safeString,
});

export type GameEventLLMOutput = z.infer<typeof GameEventLLMSchema>;
export type SessionPreludeLLMOutput = z.infer<typeof SessionPreludeLLMSchema>;
