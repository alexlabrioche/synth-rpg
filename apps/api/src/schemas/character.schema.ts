import * as z from "zod";

export const CharacterLLMSchema = z.object({
  name: z.string(),
  archetype: z.string(),
  traits: z.array(z.string()).min(1),
  description: z.string(),
});

export type CharacterLLMOutput = z.infer<typeof CharacterLLMSchema>;
