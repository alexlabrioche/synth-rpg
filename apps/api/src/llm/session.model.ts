import { ChatOllama } from "@langchain/ollama";
import {
  GameEventLLMOutput,
  GameEventLLMSchema,
  SessionPreludeLLMOutput,
  SessionPreludeLLMSchema,
  SessionContextLLM,
} from "@synth-rpg/types";
import type { ZodType } from "zod";
import { parseStructuredOutput } from "./structured-output";
import {
  buildFallbackEventFromText,
  finalizeEvent,
} from "./event-shape";

const sessionModelName = process.env.OLLAMA_SESSION_MODEL ?? "llama3.1:8b";

const chat = new ChatOllama({
  model: sessionModelName,
  temperature: 0.8,
});

const sessionStructured = chat.withStructuredOutput(GameEventLLMSchema, {
  includeRaw: true,
});

const preludeStructured = chat.withStructuredOutput(SessionPreludeLLMSchema, {
  includeRaw: true,
});

export async function callSessionModel(args: {
  systemPrompt: string;
  userPrompt: string;
  sessionContext?: SessionContextLLM;
}): Promise<GameEventLLMOutput> {
  const { systemPrompt, userPrompt, sessionContext } = args;

  const { raw, parsed } = await sessionStructured.invoke([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  if (parsed) {
    return attachContext(finalizeEvent(parsed), sessionContext);
  }

  const structured = parseStructuredOutput(raw, GameEventLLMSchema);
  if (structured) {
    return attachContext(finalizeEvent(structured), sessionContext);
  }

  const textContent = extractTextContent(raw.content);
  if (textContent) {
    const parsedFromText = parseJsonFromText(textContent, GameEventLLMSchema);
    if (parsedFromText) {
      return attachContext(finalizeEvent(parsedFromText), sessionContext);
    }
    if (textContent.trim().length > 0) {
      return attachContext(
        buildFallbackEventFromText(textContent),
        sessionContext
      );
    }
  }

  return attachContext(
    buildFallbackEventFromText("The patchbay hums but nothing emerges."),
    sessionContext
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

  const structured = parseStructuredOutput(raw, SessionPreludeLLMSchema);
  if (structured) {
    return structured;
  }

  const textContent = extractTextContent(raw.content);
  const parsedFromText = textContent
    ? parseJsonFromText(textContent, SessionPreludeLLMSchema) ??
      parseSessionPreludeFromText(textContent)
    : null;
  if (parsedFromText) {
    return parsedFromText;
  }

  if (textContent && textContent.trim().length > 0) {
    return buildFallbackPreludeFromText(textContent);
  }

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

function parseSessionPreludeFromText(
  text: string
): SessionPreludeLLMOutput | null {
  const title =
    matchLine(text, /title\s*[:\-]\s*(.+)/i) ?? extractFirstLine(text);
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

function extractFirstLine(text: string): string | null {
  const first = text.split(/\r?\n/).map((line) => line.trim())[0];
  return first && first.length ? first : null;
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

function attachContext(
  event: GameEventLLMOutput,
  context?: SessionContextLLM
): GameEventLLMOutput {
  if (!context) {
    return event;
  }

  return {
    ...event,
    sessionContext: context,
  };
}

function parseJsonFromText<T>(
  text: string,
  schema: ZodType<T>
): T | null {
  const fragments = collectJsonFragments(text);
  for (const fragment of fragments) {
    const parsed = tryParseLoose(fragment);
    if (!parsed) continue;
    const validated = schema.safeParse(parsed);
    if (validated.success) {
      return validated.data;
    }
  }
  return null;
}

function tryParseLoose(source: string): Record<string, unknown> | null {
  let current = source.trim();
  for (let attempt = 0; attempt < 4; attempt++) {
    if (!current.startsWith("{") || !current.endsWith("}")) {
      break;
    }
    try {
      return JSON.parse(current);
    } catch {
      const next = current.slice(1, -1).trim();
      if (next === current) {
        break;
      }
      current = next;
    }
  }
  return null;
}

function collectJsonFragments(text: string): string[] {
  const fragments: string[] = [];
  let depth = 0;
  let inString = false;
  let escape = false;
  let startIndex = -1;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inString) {
      if (escape) {
        escape = false;
      } else if (char === "\\") {
        escape = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      if (depth === 0) {
        startIndex = i;
      }
      depth += 1;
      continue;
    }

    if (char === "}") {
      if (depth > 0) {
        depth -= 1;
        if (depth === 0 && startIndex !== -1) {
          const fragment = text.slice(startIndex, i + 1);
          fragments.push(fragment);
          startIndex = -1;
        }
      }
    }
  }

  return fragments;
}
