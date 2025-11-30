import { ChatOllama } from "@langchain/ollama";
import { CharacterLLMOutput, CharacterLLMSchema } from "@synth-rpg/types";

import { parseStructuredOutput } from "./structured-output";

const characterModelName = process.env.OLLAMA_CHARACTER_MODEL ?? "llama3.1:8b";

const chat = new ChatOllama({
  model: characterModelName,
  temperature: 0.7,
});
console.log("[Chat character model]:", characterModelName);

export const characterStructured = chat.withStructuredOutput(
  CharacterLLMSchema,
  { includeRaw: true }
);

/**
 * Helper to invoke the model with system + user prompts and get a typed result.
 */
export async function callCharacterModel(args: {
  systemPrompt: string;
  userPrompt: string;
}): Promise<CharacterLLMOutput> {
  const { systemPrompt, userPrompt } = args;

  const { raw, parsed } = await characterStructured.invoke([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  if (parsed) {
    return parsed;
  }

  const fallback = parseStructuredOutput(raw, CharacterLLMSchema);
  if (fallback) {
    console.warn(
      "[Character model] Structured output missing, parsed from raw message."
    );
    return fallback;
  }

  console.error(
    "[Character model] Unable to parse structured output:",
    raw.content
  );
  throw new Error("Failed to parse character model response");
}
