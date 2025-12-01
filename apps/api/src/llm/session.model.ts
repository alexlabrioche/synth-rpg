import { ChatOllama } from "@langchain/ollama";
import {
  GameEventLLMOutput,
  GameEventLLMSchema,
  SessionPreludeLLMOutput,
  SessionPreludeLLMSchema,
  GameEventKind,
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

  const textContent = extractTextContent(raw.content);
  const parsedFromText = textContent
    ? parseGameEventFromText(textContent)
    : null;
  if (parsedFromText) {
    console.warn(
      "[Session model] Parsed game event response using fallback heuristics."
    );
    return parsedFromText;
  }

  if (textContent && textContent.trim().length > 0) {
    console.warn(
      "[Session model] Using raw text fallback for game event output."
    );
    return buildFallbackEventFromText(textContent);
  }

  console.error(
    "[Session model] Unable to parse structured output:",
    raw.content
  );
  return buildFallbackEventFromText(
    textContent ?? "The patchbay hums but nothing emerges."
  );
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

  const textContent = extractTextContent(raw.content);
  const parsedFromText = textContent
    ? parseSessionPreludeFromText(textContent)
    : null;
  if (parsedFromText) {
    console.warn(
      "[Session prelude model] Parsed prelude response using fallback heuristics."
    );
    return parsedFromText;
  }

  if (textContent && textContent.trim().length > 0) {
    console.warn(
      "[Session prelude model] Using raw text fallback for prelude output."
    );
    return buildFallbackPreludeFromText(textContent);
  }

  console.error(
    "[Session prelude model] Unable to parse structured output:",
    raw.content
  );
  return buildFallbackPreludeFromText(
    textContent ?? "A faint shimmer waits for a brave voltage."
  );
}

function extractTextContent(content: unknown): string | null {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    const combined = content
      .map((block) => {
        if (typeof block === "string") return block;
        if (
          block &&
          typeof block === "object" &&
          "text" in block &&
          typeof block.text === "string"
        ) {
          return block.text;
        }
        if (
          block &&
          typeof block === "object" &&
          "type" in block &&
          block.type === "text" &&
          typeof block.text === "string"
        ) {
          return block.text;
        }
        return "";
      })
      .filter(Boolean)
      .join("\n")
      .trim();
    return combined.length ? combined : null;
  }

  return null;
}

const EVENT_KIND_LOOKUP: Record<string, GameEventKind> = {
  opportunity: GameEventKind.Opportunity,
  boon: GameEventKind.Boon,
  complication: GameEventKind.Complication,
  mutation: GameEventKind.Mutation,
  catastrophe: GameEventKind.Catastrophe,
};

function parseGameEventFromText(text: string): GameEventLLMOutput | null {
  const title = matchLine(text, /title\s*[:\-]\s*(.+)/i) ?? extractFirstLine(text);
  const kindRaw =
    matchLine(text, /kind\s*[:\-]\s*(.+)/i) ??
    matchLine(text, /event\s*type\s*[:\-]\s*(.+)/i);
  const kind = normalizeEventKind(kindRaw);
  const tone =
    matchLine(text, /tone\s*[:\-]\s*(.+)/i) ??
    matchLine(text, /mood\s*[:\-]\s*(.+)/i) ??
    "neutral";
  const narrative =
    matchBlock(text, /narrative\s*[:\-]/i) ??
    matchBlock(text, /scene\s*[:\-]/i) ??
    extractFallbackDescription(text);
  const instructionsBlock =
    matchBlock(text, /instructions?\s*[:\-]/i) ??
    matchBlock(text, /actions?\s*[:\-]/i);
  const instructions = instructionsBlock
    ? splitInstructions(instructionsBlock)
    : [];

  if (title && narrative) {
    return {
      title: title.trim(),
      kind,
      narrative: narrative.trim(),
      tone: tone.trim(),
      instructions: instructions.length ? instructions : [],
    };
  }

  return null;
}

function parseSessionPreludeFromText(
  text: string
): SessionPreludeLLMOutput | null {
  const title = matchLine(text, /title\s*[:\-]\s*(.+)/i) ?? extractFirstLine(text);
  const narrative =
    matchBlock(text, /narrative\s*[:\-]/i) ??
    matchBlock(text, /story\s*[:\-]/i) ??
    extractFallbackDescription(text);
  const tone =
    matchLine(text, /tone\s*[:\-]\s*(.+)/i) ??
    matchLine(text, /mood\s*[:\-]\s*(.+)/i) ??
    "mystical";
  const instructions =
    matchLine(text, /instructions?\s*[:\-]\s*(.+)/i) ??
    matchBlock(text, /instructions?\s*[:\-]/i) ??
    "";

  if (title && narrative) {
    return {
      title: title.trim(),
      narrative: narrative.trim(),
      tone: tone.trim(),
      instructions: instructions.trim(),
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
  return match?.[1]?.trim() ?? null;
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
        !/^title\s*[:\-]/i.test(line) &&
        !/^kind\s*[:\-]/i.test(line) &&
        !/^tone\s*[:\-]/i.test(line) &&
        !/^instructions?\s*[:\-]/i.test(line)
    )
    .join(" ");
}

function splitInstructions(block: string): string[] {
  return block
    .split(/\r?\n|[•\-*]/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function extractFirstLine(text: string): string | null {
  const first = text.split(/\r?\n/).map((line) => line.trim())[0];
  return first && first.length ? first : null;
}

function normalizeEventKind(value?: string | null): GameEventKind {
  if (!value) return GameEventKind.Opportunity;
  const normalized = value.toLowerCase().trim();
  return EVENT_KIND_LOOKUP[normalized] ?? GameEventKind.Opportunity;
}

function buildFallbackEventFromText(text: string): GameEventLLMOutput {
  const firstLine = extractFirstLine(text) ?? "Unexpected resonance";
  return {
    title: firstLine,
    kind: GameEventKind.Opportunity,
    narrative: text.trim(),
    tone: "mysterious",
    instructions: [],
  };
}

function buildFallbackPreludeFromText(text: string): SessionPreludeLLMOutput {
  const firstLine = extractFirstLine(text) ?? "Awakening";
  return {
    title: firstLine,
    narrative: text.trim(),
    tone: "mystical",
    instructions: "",
  };
}
