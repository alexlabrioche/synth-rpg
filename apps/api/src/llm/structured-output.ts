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

function extractFromToolCalls(raw: BaseMessage): JsonObject | null {
  const toolCalls = (raw as unknown as { tool_calls?: Array<{ args?: unknown }> })
    .tool_calls;

  if (!Array.isArray(toolCalls)) {
    return null;
  }

  for (const call of toolCalls) {
    const normalized = normalizeJSON(call?.args);
    if (normalized) {
      return unwrapArguments(normalized);
    }
  }

  return null;
}

function extractFromContent(raw: BaseMessage): JsonObject | null {
  const asText = messageContentToString(raw.content);
  if (!asText) {
    return null;
  }

  const normalized = normalizeJSON(asText);
  if (!normalized) {
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
      return null;
    }
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return value as JsonObject;
  }

  return null;
}

function unwrapArguments(payload: JsonObject): JsonObject {
  const argsValue = payload.arguments ?? payload.args;
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
