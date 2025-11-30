import type {
  CharacterStats,
  GameTurnEvent,
  Lang,
  Session,
  SessionPrelude,
} from "@synth-rpg/types";
import { GameEventKind, GamePhase } from "@synth-rpg/types";
import { CAPABILITY_TRANSLATIONS } from "@synth-rpg/specs";
import {
  callSessionModel,
  callSessionPreludeModel,
} from "../llm/session.model";
import {
  getSessionPreludeUserPrompt,
  getSessionSystemPrompt,
  getSessionTurnUserPrompt,
} from "../llm/session.prompts";
import {
  characterRepo,
  eventRepo,
  preludeRepo,
  sessionRepo,
} from "../repo/memory.repo";
import { rollDie } from "../utils/roll-die";
import { adjustStatsForEvent } from "../helpers/session.helpers";

interface StartSessionInput {
  characterId: string;
  lang: Lang;
}

interface StartSessionResult {
  session: Session;
  prelude: SessionPrelude;
}

export class CharacterNotFoundError extends Error {
  constructor(id: string) {
    super(`Character ${id} not found`);
    this.name = "CharacterNotFoundError";
  }
}

export class SessionNotFoundError extends Error {
  constructor(id: string) {
    super(`Session ${id} not found`);
    this.name = "SessionNotFoundError";
  }
}

const getEventKindFromRoll = (roll: number): GameEventKind => {
  if (roll === 1) {
    return GameEventKind.Catastrophe;
  }
  if (roll <= 5) {
    return GameEventKind.Mutation;
  }
  if (roll <= 10) {
    return GameEventKind.Complication;
  }
  if (roll <= 16) {
    return GameEventKind.Opportunity;
  }
  return GameEventKind.Boon;
};

const formatCapabilityHints = (
  capabilities: { slug: string; label: string; description: string }[],
  lang: Lang
): string => {
  const dictionary =
    CAPABILITY_TRANSLATIONS[lang] ?? CAPABILITY_TRANSLATIONS.en;

  if (!capabilities || capabilities.length === 0) {
    return "- aucune capacité fournie";
  }

  return capabilities
    .map((cap) => {
      const translation = dictionary[cap.slug];
      const label =
        translation?.label ??
        cap.label ??
        cap.slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      return `- ${label}`;
    })
    .join("\n");
};

const getCapabilityLabels = (
  capabilities: { slug: string; label: string }[],
  lang: Lang
): string[] => {
  const dictionary =
    CAPABILITY_TRANSLATIONS[lang] ?? CAPABILITY_TRANSLATIONS.en;

  return capabilities
    .map((cap) => {
      const translation = dictionary[cap.slug];
      return (
        translation?.label ??
        cap.label ??
        cap.slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      );
    })
    .filter((label) => label.length > 0);
};

const STAT_LABELS: Record<Lang, Record<keyof CharacterStats, string>> = {
  en: {
    density: "density",
    chaos: "chaos",
    stability: "stability",
    percussiveness: "percussion",
    expressivity: "expressivity",
    spatiality: "space",
  },
  fr: {
    density: "densité",
    chaos: "chaos",
    stability: "stabilité",
    percussiveness: "percussivité",
    expressivity: "expressivité",
    spatiality: "spatialité",
  },
};

const pickDominantStat = (stats: CharacterStats): keyof CharacterStats => {
  const entries = Object.entries(stats ?? {}) as [
    keyof CharacterStats,
    number,
  ][];
  entries.sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  return entries[0]?.[0] ?? "density";
};

const buildFallbackInstructions = (
  capabilities: { slug: string; label: string }[],
  stats: CharacterStats,
  lang: Lang
): string => {
  const labels = getCapabilityLabels(capabilities, lang);
  const primary = labels[0] ?? (lang === "fr" ? "ta source" : "your source");
  const secondary = labels.find((label) => label !== primary);
  const dominantStat = pickDominantStat(stats);
  const statLabel = STAT_LABELS[lang][dominantStat];

  if (lang === "fr") {
    const first = `Commence avec "${primary}" pour ouvrir le voile.`;
    const second = secondary
      ? `Puis guide "${secondary}" via ${statLabel}.`
      : `Puis sculpte ${statLabel} en respirant lentement.`;
    return `${first} ${second}`;
  }

  const first = `Start with "${primary}" to wake the haze.`;
  const second = secondary
    ? `Then steer "${secondary}" through ${statLabel}.`
    : `Then let ${statLabel} drift outward.`;
  return `${first} ${second}`;
};

const asStringArray = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null;
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const stripQuotes = (value: string) =>
  value.replace(/^[\s"'“”«»`]+/, "").replace(/[\s"'“”«»`]+$/, "");

const tryFallbackListParse = (raw: string): string[] | null => {
  const inner = raw.slice(1, -1).trim();
  if (!inner) return [];
  const items = inner
    .split(/[,，]/)
    .map((item) => stripQuotes(item))
    .filter((item) => item.length > 0);
  return items.length > 0 ? items : null;
};

const tryParseList = (value: string): string[] | null => {
  const trimmed = value.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return null;
  try {
    const normalized = trimmed.replace(/[“”«»]/g, '"');
    const parsed = JSON.parse(normalized);
    return asStringArray(parsed);
  } catch {
    return tryFallbackListParse(trimmed);
  }
};

const splitSentences = (value: string): string[] =>
  value
    .split(/[\n\r]+/)
    .map((part) =>
      part
        .replace(/^[\s•\-–—]+/, "")
        .replace(/[\s]+$/, "")
        .trim()
    )
    .filter((part) => part.length > 0);

const normalizeInstructions = (
  input: string | string[] | undefined
): string[] => {
  if (!input) return [];
  if (Array.isArray(input)) {
    const cleaned = asStringArray(input) ?? [];
    return cleaned.slice(0, 3);
  }
  const parsed = tryParseList(input);
  if (parsed) {
    return parsed.slice(0, 3);
  }
  const lines = splitSentences(input);
  if (lines.length > 0) {
    return lines.slice(0, 3);
  }
  const trimmed = input.trim();
  return trimmed ? [trimmed] : [];
};

const normalizeNarrative = (input: string | undefined): string => {
  if (!input) return "";
  const trimmed = input.trim();
  return trimmed;
};

const normalizeTone = (input: string | undefined): string => {
  if (!input) return "";
  const parts = input
    .split(/[,\n]/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .slice(0, 3);

  return parts.join(", ");
};

export async function startSession(
  input: StartSessionInput
): Promise<StartSessionResult> {
  const character = characterRepo.get(input.characterId);

  if (!character) {
    throw new CharacterNotFoundError(input.characterId);
  }

  const systemPrompt = getSessionSystemPrompt({ lang: input.lang });
  const capabilityHints = formatCapabilityHints(
    character.capabilities,
    input.lang
  );
  const userPrompt = getSessionPreludeUserPrompt({
    character,
    lang: input.lang,
    capabilityHints,
  });

  const llmOutput = await callSessionPreludeModel({
    systemPrompt,
    userPrompt,
  });

  const sessionId = crypto.randomUUID();
  const turn = 0;

  const session: Session = {
    id: sessionId,
    characterId: character.id,
    lang: input.lang,
    turn,
    stats: character.stats,
    phase: GamePhase.InProgress,
    createdAt: new Date().toISOString(),
  };

  const prelude: SessionPrelude = {
    id: crypto.randomUUID(),
    sessionId,
    title: llmOutput.title.trim(),
    narrative: llmOutput.narrative.trim(),
    tone: llmOutput.tone.trim(),
    instructions: llmOutput.instructions?.trim().length
      ? llmOutput.instructions.trim()
      : buildFallbackInstructions(
          character.capabilities,
          character.stats,
          input.lang
        ),
  };

  sessionRepo.save(session);
  preludeRepo.save(prelude);

  return { session, prelude };
}

interface PlayNextTurnInput {
  sessionId: string;
}

interface PlayNextTurnResult {
  session: Session;
  event: GameTurnEvent;
}

interface SessionDetails {
  session: Session;
  prelude: SessionPrelude | null;
}

export async function playNextTurn(
  input: PlayNextTurnInput
): Promise<PlayNextTurnResult> {
  const session = sessionRepo.get(input.sessionId);

  if (!session) {
    throw new SessionNotFoundError(input.sessionId);
  }

  const character = characterRepo.get(session.characterId);

  if (!character) {
    throw new CharacterNotFoundError(session.characterId);
  }

  const roll = rollDie(20);
  const kind = getEventKindFromRoll(roll);
  const nextTurn = session.turn + 1;

  const systemPrompt = getSessionSystemPrompt({ lang: session.lang });
  const userPrompt = getSessionTurnUserPrompt({
    character,
    lang: session.lang,
    roll,
    kind,
  });

  const llmOutput = await callSessionModel({
    systemPrompt,
    userPrompt,
  });

  const instructions = normalizeInstructions(llmOutput.instructions);
  const narrative = normalizeNarrative(llmOutput.narrative);
  const tone = normalizeTone(llmOutput.tone);

  const event: GameTurnEvent = {
    id: crypto.randomUUID(),
    sessionId: session.id,
    turn: nextTurn,
    kind,
    roll,
    title: llmOutput.title.trim(),
    narrative,
    tone,
    instructions,
  };

  const updatedStats = adjustStatsForEvent(session.stats, kind, roll);
  eventRepo.save(event);
  const updatedSession = sessionRepo.update(session.id, {
    turn: nextTurn,
    stats: updatedStats,
  }) ?? {
    ...session,
    turn: nextTurn,
    stats: updatedStats,
  };

  return { session: updatedSession, event };
}

export function getSessionDetails(sessionId: string): SessionDetails | null {
  const session = sessionRepo.get(sessionId);
  if (!session) {
    return null;
  }

  const prelude = preludeRepo.getBySession(sessionId) ?? null;
  return { session, prelude };
}

export function getSessionEvents(sessionId: string): GameTurnEvent[] {
  return eventRepo.getBySession(sessionId);
}
