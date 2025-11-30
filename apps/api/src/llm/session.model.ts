import { ChatOllama } from "@langchain/ollama";
import {
  GameEventLLMOutput,
  GameEventLLMSchema,
  SessionPreludeLLMOutput,
  SessionPreludeLLMSchema,
} from "@synth-rpg/types";
import { parseStructuredOutput } from "./structured-output";

const sessionModelName = process.env.OLLAMA_SESSION_MODEL ?? "llama3.1:8b";

const chat = new ChatOllama({
  model: sessionModelName,
  temperature: 0.8,
});
console.log("[Chat session model]:", sessionModelName);

const sessionStructured = chat.withStructuredOutput(GameEventLLMSchema, {
  includeRaw: true,
});
const preludeStructured = chat.withStructuredOutput(
  SessionPreludeLLMSchema,
  { includeRaw: true }
);

export async function callSessionModel(args: {
  systemPrompt: string;
  userPrompt: string;
}): Promise<GameEventLLMOutput> {
  const { systemPrompt, userPrompt } = args;

  const { raw, parsed } = await sessionStructured.invoke([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  if (parsed) {
    return parsed;
  }

  const fallback = parseStructuredOutput(raw, GameEventLLMSchema);
  if (fallback) {
    console.warn(
      "[Session model] Structured output missing, parsed from raw message."
    );
    return fallback;
  }

  console.error(
    "[Session model] Unable to parse structured output:",
    raw.content
  );
  throw new Error("Failed to parse session model response");
}

export async function callSessionPreludeModel(args: {
  systemPrompt: string;
  userPrompt: string;
}): Promise<SessionPreludeLLMOutput> {
  const { systemPrompt, userPrompt } = args;

  const { raw, parsed } = await preludeStructured.invoke([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  if (parsed) {
    return parsed;
  }

  const fallback = parseStructuredOutput(raw, SessionPreludeLLMSchema);
  if (fallback) {
    console.warn(
      "[Session prelude model] Structured output missing, parsed from raw message."
    );
    return fallback;
  }

  console.error(
    "[Session prelude model] Unable to parse structured output:",
    raw.content
  );
  throw new Error("Failed to parse session prelude response");
}
