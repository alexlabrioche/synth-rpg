import { ChatOllama } from "@langchain/ollama";
import { CharacterLLMOutput, CharacterLLMSchema } from "@synth-rpg/types";

import { parseStructuredOutput } from "./structured-output";

const characterModelName = process.env.OLLAMA_CHARACTER_MODEL ?? "llama3.1:8b";

const chat = new ChatOllama({
  model: characterModelName,
  temperature: 0.7,
});

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

  const textContent = extractTextContent(raw.content);
  const parsedFromText = textContent
    ? parseCharacterFromText(textContent)
    : null;
  if (parsedFromText) {
    console.warn(
      "[Character model] Parsed character response using fallback heuristics."
    );
    return parsedFromText;
  }

  console.error(
    "[Character model] Unable to parse structured output:",
    raw.content
  );
  throw new Error("Failed to parse character model response");
}

function extractTextContent(content: unknown): string | null {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    const parts = content
      .map((block) => extractTextBlock(block))
      .filter(Boolean)
      .join("\n")
      .trim();
    return parts.length ? parts : null;
  }

  if (content && typeof content === "object") {
    const value = extractTextBlock(content);
    return value.length ? value : null;
  }

  return null;
}

function extractTextBlock(block: unknown): string {
  if (typeof block === "string") {
    return block;
  }

  if (block && typeof block === "object") {
    const maybeText = (block as { text?: unknown }).text;
    if (typeof maybeText === "string") {
      return maybeText;
    }

    const maybeType = (block as { type?: unknown }).type;
    const asText = (block as { text?: unknown }).text;
    if (maybeType === "text" && typeof asText === "string") {
      return asText;
    }

    const argumentSource =
      (block as { arguments?: unknown }).arguments ??
      (block as { args?: unknown }).args ??
      (block as { input?: unknown }).input ??
      (block as { content?: unknown }).content ??
      (block as { function?: { arguments?: unknown } }).function?.arguments ??
      null;

    if (typeof argumentSource === "string") {
      return argumentSource;
    }

    if (
      argumentSource &&
      typeof argumentSource === "object" &&
      !Array.isArray(argumentSource)
    ) {
      try {
        return JSON.stringify(argumentSource);
      } catch {
        return "";
      }
    }

    try {
      return JSON.stringify(block);
    } catch {
      return "";
    }
  }

  return "";
}

function parseCharacterFromText(text: string): CharacterLLMOutput | null {
  const name = matchLine(text, /name\s*[:\-]\s*(.+)/i);
  const archetype = matchLine(text, /archetype\s*[:\-]\s*(.+)/i);
  const description =
    matchBlock(text, /description\s*[:\-]/i) ??
    matchBlock(text, /backstory\s*[:\-]/i) ??
    extractFallbackDescription(text);
  const traitsBlock = matchBlock(text, /traits?\s*[:\-]/i);
  const traits = traitsBlock
    ? traitsBlock
        .split(/\r?\n/)
        .map((line) => line.replace(/^[-*•\d.\s]+/, "").trim())
        .filter(Boolean)
    : [];

  if (name && archetype && description) {
    return {
      name: name.trim(),
      archetype: archetype.trim(),
      description: description.trim(),
      traits: traits.length ? traits : ["enigmatic"],
    };
  }

  return null;
}

function matchLine(text: string, regex: RegExp): string | null {
  const match = text.match(regex);
  return match?.[1]?.trim() ?? null;
}

function matchBlock(text: string, headingRegex: RegExp): string | null {
  const match = text.match(
    new RegExp(`${headingRegex.source}([\\s\\S]*?)(?:\\n\\s*\\n|$)`, "i")
  );
  if (!match) return null;
  return match[1]?.trim() ?? null;
}

function extractFallbackDescription(text: string): string | null {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return null;
  return lines
    .filter(
      (line) =>
        !/^name\s*[:\-]/i.test(line) &&
        !/^archetype\s*[:\-]/i.test(line) &&
        !/^traits?\s*[:\-]/i.test(line)
    )
    .join(" ");
}
