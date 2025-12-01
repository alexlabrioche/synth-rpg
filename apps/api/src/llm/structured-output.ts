import type { BaseMessage } from "@langchain/core/messages";
import type { ZodType } from "zod";

type JsonObject = Record<string, unknown>;

/**
 * Attempt to parse a structured output from an AI message when the built-in
 * LangChain parser could not produce a result.
 */
export function parseStructuredOutput<T>(
  raw: BaseMessage,
  schema: ZodType<T>
): T | null {
  const candidate = extractPayload(raw);
  if (!candidate) {
    return null;
  }

  const parsed = schema.safeParse(candidate);
  if (parsed.success) {
    return parsed.data;
  }

  return null;
}

function extractPayload(raw: BaseMessage): JsonObject | null {
  return extractFromToolCalls(raw) ?? extractFromContent(raw);
}

type ToolCall = {
  args?: unknown;
  arguments?: unknown;
  parameters?: unknown;
  function?: { arguments?: unknown };
};

function extractFromToolCalls(raw: BaseMessage): JsonObject | null {
  const toolCalls = collectToolCalls(raw);

  if (!Array.isArray(toolCalls)) {
    return null;
  }

  for (const call of toolCalls) {
    const source =
      call?.arguments ??
      call?.args ??
      call?.parameters ??
      call?.function?.arguments ??
      call ??
      null;
    const normalized = normalizeJSON(source);
    if (normalized) {
      return unwrapArguments(normalized);
    }
  }

  return null;
}

function extractFromContent(raw: BaseMessage): JsonObject | null {
  const payloads = collectContentPayloads(raw.content);
  for (const payload of payloads) {
    const normalized = normalizeJSON(payload);
    if (normalized) {
      const unwrapped = unwrapArguments(normalized);
      if (Object.keys(unwrapped).length > 0) {
        return unwrapped;
      }
    }
  }

  const asText = messageContentToString(raw.content);
  if (!asText) {
    return null;
  }

  const normalized = normalizeJSON(asText);
  if (!normalized) {
    const fragments = extractJsonFragments(asText);
    for (const fragment of fragments) {
      const parsed = normalizeJSON(fragment);
      if (parsed) {
        const unwrapped = unwrapArguments(parsed);
        if (Object.keys(unwrapped).length > 0) {
          return unwrapped;
        }
      }
    }

    return null;
  }

  return unwrapArguments(normalized);
}

function messageContentToString(
  content: BaseMessage["content"]
): string | null {
  if (typeof content === "string") {
    return content;
  }

  if (content && typeof content === "object" && !Array.isArray(content)) {
    try {
      return JSON.stringify(content);
    } catch {
      return null;
    }
  }

  if (Array.isArray(content)) {
    const text = content
      .map((block) => {
        if (typeof block === "string") {
          return block;
        }

        if (
          block &&
          typeof block === "object" &&
          "type" in block &&
          block.type === "text" &&
          "text" in block &&
          typeof block.text === "string"
        ) {
          return block.text;
        }

        if (
          block &&
          typeof block === "object" &&
          "text" in block &&
          typeof (block as { text?: string }).text === "string"
        ) {
          return (block as { text?: string }).text ?? "";
        }

        return "";
      })
      .filter(Boolean)
      .join("\n")
      .trim();

    return text.length > 0 ? text : null;
  }

  return null;
}

function collectContentPayloads(
  content: BaseMessage["content"]
): unknown[] {
  if (!content) {
    return [];
  }

  if (typeof content === "string") {
    return [content];
  }

  if (typeof content === "object" && !Array.isArray(content)) {
    return [content];
  }

  if (!Array.isArray(content)) {
    return [];
  }

  const payloads: unknown[] = [];

  for (const block of content) {
    if (!block) continue;

    if (typeof block === "string") {
      payloads.push(block);
      continue;
    }

    if (typeof block === "object") {
      if ("text" in block && typeof block.text === "string") {
        payloads.push(block.text);
      }

      if ("content" in block && typeof block.content === "string") {
        payloads.push(block.content);
      }

      const argsSource =
        (block as { arguments?: unknown }).arguments ??
        (block as { args?: unknown }).args ??
        (block as { input?: unknown }).input ??
        (block as { parameters?: unknown }).parameters ??
        (block as { function?: { arguments?: unknown } }).function?.arguments ??
        null;

      if (argsSource) {
        payloads.push(argsSource);
      }
    }
  }

  return payloads;
}

function normalizeJSON(value: unknown): JsonObject | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = stripCodeFence(value);
    if (!trimmed) {
      return null;
    }

    try {
      return JSON.parse(trimmed);
    } catch {
      return parseLooseJson(trimmed);
    }
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return value as JsonObject;
  }

  return null;
}

function parseLooseJson(text: string): JsonObject | null {
  let current = text.trim();
  // Attempt to strip stray braces one layer at a time (e.g., "{{...}}")
  for (let i = 0; i < 3; i++) {
    if (!current.startsWith("{") || !current.endsWith("}")) break;
    try {
      return JSON.parse(current);
    } catch {
      current = current.slice(1, -1).trim();
    }
  }

  return null;
}

function unwrapArguments(payload: JsonObject): JsonObject {
  const argsValue =
    payload.arguments ?? payload.args ?? payload.parameters ?? null;
  if (!argsValue) {
    return payload;
  }

  const normalized = normalizeJSON(argsValue);
  if (normalized) {
    return normalized;
  }

  if (
    typeof argsValue === "object" &&
    argsValue !== null &&
    !Array.isArray(argsValue)
  ) {
    return argsValue as JsonObject;
  }

  return payload;
}

function stripCodeFence(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  return trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractJsonFragments(text: string): string[] {
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

function collectToolCalls(raw: BaseMessage): ToolCall[] | null {
  const base = (raw as unknown as { tool_calls?: ToolCall[] }).tool_calls;
  const additional = (raw as unknown as {
    additional_kwargs?: { tool_calls?: ToolCall[] };
  }).additional_kwargs?.tool_calls;
  const responseCalls = extractResponseToolCalls(
    (raw as unknown as { response?: unknown }).response
  );

  const calls = [base, additional, responseCalls]
    .filter((value): value is ToolCall[] => Array.isArray(value))
    .flat();

  return calls.length > 0 ? calls : null;
}

function extractResponseToolCalls(response: unknown): ToolCall[] | null {
  if (!response) return null;
  if (Array.isArray(response)) {
    const calls = response
      .map((entry) => {
        if (
          entry &&
          typeof entry === "object" &&
          "message" in entry &&
          entry.message &&
          typeof (entry.message as { tool_calls?: ToolCall[] }).tool_calls !==
            "undefined"
        ) {
          return (entry.message as { tool_calls?: ToolCall[] }).tool_calls;
        }
        return null;
      })
      .filter((value): value is ToolCall[] => Array.isArray(value))
      .flat();

    return calls.length > 0 ? calls : null;
  }
  return null;
}
