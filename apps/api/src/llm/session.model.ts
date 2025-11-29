import { ChatOllama } from "@langchain/ollama";
import {
  GameEventLLMOutput,
  GameEventLLMSchema,
  SessionPreludeLLMOutput,
  SessionPreludeLLMSchema,
} from "../schemas/session.schema";

const chat = new ChatOllama({
  model: process.env.OLLAMA_MODEL ?? "llama3.1:8b",
  temperature: 0.8,
});

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
