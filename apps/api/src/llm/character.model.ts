import { ChatOllama } from "@langchain/ollama";
import {
  CharacterLLMOutput,
  CharacterLLMSchema,
} from "../schemas/character.schema";

const chat = new ChatOllama({
  model: process.env.OLLAMA_MODEL ?? "llama3.1:8b",
  temperature: 0.7,
});

export const characterStructured = chat.withStructuredOutput(
  CharacterLLMSchema,
  {}
);

/**
 * Helper to invoke the model with system + user prompts and get a typed result.
 */
export async function callCharacterModel(args: {
  systemPrompt: string;
  userPrompt: string;
}): Promise<CharacterLLMOutput> {
  const { systemPrompt, userPrompt } = args;

  const res = await characterStructured.invoke([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  return res;
}
