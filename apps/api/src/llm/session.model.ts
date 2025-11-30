import { ChatOllama } from "@langchain/ollama";
import {
  GameEventLLMOutput,
  GameEventLLMSchema,
  SessionPreludeLLMOutput,
  SessionPreludeLLMSchema,
} from "@synth-rpg/types";

const sessionModelName = process.env.OLLAMA_SESSION_MODEL ?? "llama3.1:8b";

const chat = new ChatOllama({
  model: sessionModelName,
  temperature: 0.8,
});
console.log("[Chat session model]:", sessionModelName);

const sessionStructured = chat.withStructuredOutput(GameEventLLMSchema, {});
const preludeStructured = chat.withStructuredOutput(
  SessionPreludeLLMSchema,
  {}
);

export async function callSessionModel(args: {
  systemPrompt: string;
  userPrompt: string;
}): Promise<GameEventLLMOutput> {
  const { systemPrompt, userPrompt } = args;

  const res = await sessionStructured.invoke([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  return res;
}

export async function callSessionPreludeModel(args: {
  systemPrompt: string;
  userPrompt: string;
}): Promise<SessionPreludeLLMOutput> {
  const { systemPrompt, userPrompt } = args;

  const res = await preludeStructured.invoke([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  return res;
}
