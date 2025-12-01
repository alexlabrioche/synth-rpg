import type { GameEventLLMOutput } from "@synth-rpg/types";
import { GameEventKind } from "@synth-rpg/types";

export const DEFAULT_NARRATIVE =
  "A wavering hush hangs above the patchbay, waiting for someone to stir it.";
export const DEFAULT_STRATEGY =
  "Hand the lead to the most overlooked control and let it misbehave.";
export const DEFAULT_ABSTRACT =
  "Trade one certainty for the promise of an unexpected resonance.";

type TextLike = string | string[] | null | undefined;

const toSingleLine = (value: TextLike): string | null => {
  if (!value) {
    return null;
  }
  if (Array.isArray(value)) {
    return value
      .map((part) => part?.trim())
      .filter((part): part is string => Boolean(part && part.length))
      .join(" ");
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const ensureLine = (value: TextLike, fallback: string) =>
  toSingleLine(value) ?? fallback;

type EventLike = Partial<GameEventLLMOutput> & {
  narrative?: TextLike;
  narrativeContext?: TextLike;
  gearStrategy?: TextLike;
  abstractPrompt?: TextLike;
  title?: TextLike;
  nextHook?: TextLike;
};

export function finalizeEvent(candidate: EventLike): GameEventLLMOutput {
  const telemetry = candidate.telemetry ?? { warnings: [] };
  const warnings = telemetry.warnings ?? [];

  const narrativeSource =
    candidate.narrative ?? candidate.narrativeContext ?? null;

  return {
    title: ensureLine(candidate.title, "Unexpected resonance"),
    kind: candidate.kind ?? GameEventKind.Opportunity,
    sessionContext: candidate.sessionContext ?? undefined,
    narrative: ensureLine(narrativeSource, DEFAULT_NARRATIVE),
    narrativeContext: ensureLine(narrativeSource, DEFAULT_NARRATIVE),
    gearStrategy: ensureLine(candidate.gearStrategy, DEFAULT_STRATEGY),
    abstractPrompt: ensureLine(candidate.abstractPrompt, DEFAULT_ABSTRACT),
    nextHook: toSingleLine(candidate.nextHook) ?? undefined,
    tags: candidate.tags ?? [],
    telemetry: {
      ...telemetry,
      warnings,
    },
  };
}

export function buildFallbackEventFromText(
  text: string,
  warning: string = "fallback-from-text"
): GameEventLLMOutput {
  const firstLine = text.split(/\r?\n/).map((line) => line.trim())[0];
  return finalizeEvent({
    title: firstLine && firstLine.length ? firstLine : "Unexpected resonance",
    kind: GameEventKind.Opportunity,
    narrative: text.trim(),
    tags: [],
    telemetry: { warnings: [warning] },
  });
}
