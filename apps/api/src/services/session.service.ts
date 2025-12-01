import type {
  Character,
  CharacterStats,
  GameTurnEvent,
  Lang,
  Session,
  SessionContextLLM,
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

const TURN_TEMPLATE_VERSION = "turn/v2";

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

interface BuildSessionContextParams {
  session: Session;
  character: Character;
  lang: Lang;
  previousEvents: GameTurnEvent[];
}

const buildSessionContext = ({
  session,
  character,
  lang,
  previousEvents,
}: BuildSessionContextParams): SessionContextLLM => {
  const capabilityLabels = getCapabilityLabels(character.capabilities, lang);
  const sortedEvents = [...previousEvents].sort((a, b) => b.turn - a.turn);
  const recentMoves = sortedEvents.slice(0, 3).map((event) => {
    const prefix = lang === "fr" ? `Tour ${event.turn}` : `Turn ${event.turn}`;
    const kindLabel = event.kind.toLowerCase();
    const action = event.abstractPrompt || event.gearStrategy;
    return `${prefix} (${kindLabel}): ${event.title} — ${action}`;
  });

  const moodTagEvent = sortedEvents.find((event) =>
    event.tags?.some((tag) => tag.type === "mood")
  );
  const moodTag = moodTagEvent?.tags?.find(
    (tag) => tag.type === "mood"
  )?.value;

  const mood =
    moodTag ??
    character.traits[0] ??
    (lang === "fr" ? "curiosité diffuse" : "curious drift");

  const dominantStat = pickDominantStat(session.stats);
  const statLabel = STAT_LABELS[lang][dominantStat];
  const statValue = session.stats[dominantStat];
  const focus =
    lang === "fr"
      ? `Accent sur ${statLabel} (${statValue}/10).`
      : `Focus on ${statLabel} (${statValue}/10).`;

  const goal =
    lang === "fr"
      ? `Guider ${character.name} vers une percée ${character.archetype}.`
      : `Guide ${character.name} toward a ${character.archetype} breakthrough.`;

  const gearEntryName =
    lang === "fr"
      ? `Ensemble de ${character.name}`
      : `${character.name}'s rig`;

  return {
    goal,
    mood,
    focus,
    location: undefined,
    gear: [
      {
        name: gearEntryName,
        role: character.archetype,
        description: character.description,
        capabilities: capabilityLabels,
        traits: character.traits,
      },
    ],
    recentMoves,
    capabilityTags: capabilityLabels,
  };
};

const normalizeText = (value: string | string[] | undefined): string => {
  if (!value) return "";
  if (Array.isArray(value)) {
    return value
      .map((part) => part?.trim())
      .filter((part): part is string => Boolean(part && part.length))
      .join(" ")
      .trim();
  }
  return value.trim();
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

  const existingEvents = eventRepo.getBySession(session.id);
  const systemPrompt = getSessionSystemPrompt({ lang: session.lang });
  const capabilityHints = formatCapabilityHints(
    character.capabilities,
    session.lang
  );
  const sessionContext = buildSessionContext({
    session,
    character,
    lang: session.lang,
    previousEvents: existingEvents,
  });
  const userPrompt = getSessionTurnUserPrompt({
    character,
    lang: session.lang,
    roll,
    kind,
    capabilityHints,
    sessionContext,
  });

  const llmOutput = await callSessionModel({
    systemPrompt,
    userPrompt,
    sessionContext,
  });

  const telemetry = {
    ...llmOutput.telemetry,
    templateVersion:
      llmOutput.telemetry?.templateVersion ?? TURN_TEMPLATE_VERSION,
    warnings: llmOutput.telemetry?.warnings ?? [],
  };

  const event: GameTurnEvent = {
    id: crypto.randomUUID(),
    sessionId: session.id,
    turn: nextTurn,
    kind,
    roll,
    title: llmOutput.title?.trim() ?? "Untitled",
    narrativeContext: normalizeText(
      (llmOutput as { narrative?: string | string[] }).narrative ??
        (llmOutput as { narrativeContext?: string | string[] })
          .narrativeContext
    ),
    gearStrategy: normalizeText(llmOutput.gearStrategy),
    abstractPrompt: normalizeText(llmOutput.abstractPrompt),
    nextHook: normalizeText(llmOutput.nextHook) || undefined,
    tags: llmOutput.tags ?? [],
    telemetry,
    sessionContext: llmOutput.sessionContext ?? sessionContext,
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
