import type { GameEvent, Lang, Session, SessionPrelude } from "@synth-rpg/types";
import { GameEventKind, GamePhase } from "@synth-rpg/types";
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

const asStringArray = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null;
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const tryParseConstraints = (value: string): string[] | null => {
  const trimmed = value.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return null;
  try {
    const parsed = JSON.parse(trimmed);
    return asStringArray(parsed);
  } catch {
    return null;
  }
};

const normalizeConstraints = (input: string | string[] | undefined): string[] => {
  if (!input) return [];
  if (Array.isArray(input)) {
    const cleaned = asStringArray(input);
    return cleaned ?? [];
  }
  const parsed = tryParseConstraints(input);
  if (parsed) {
    return parsed;
  }
  const trimmed = input.trim();
  return trimmed.length > 0 ? [trimmed] : [];
};

export async function startSession(
  input: StartSessionInput
): Promise<StartSessionResult> {
  const character = characterRepo.get(input.characterId);

  if (!character) {
    throw new CharacterNotFoundError(input.characterId);
  }

  const systemPrompt = getSessionSystemPrompt({ lang: input.lang });
  const userPrompt = getSessionPreludeUserPrompt({
    character,
    lang: input.lang,
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
    invitation: llmOutput.invitation.trim(),
    scene: llmOutput.scene.trim(),
    lore: llmOutput.lore.trim(),
    tone: llmOutput.tone.trim(),
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
  event: GameEvent;
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

  const constraints = normalizeConstraints(llmOutput.constraints);

  const event: GameEvent = {
    id: crypto.randomUUID(),
    sessionId: session.id,
    turn: nextTurn,
    kind,
    roll,
    title: llmOutput.title.trim(),
    instructions: llmOutput.instructions.trim(),
    constraints,
    description: llmOutput.description?.trim() ?? "",
  };

  const updatedStats = adjustStatsForEvent(session.stats, kind, roll);
  eventRepo.save(event);
  const updatedSession =
    sessionRepo.update(session.id, { turn: nextTurn, stats: updatedStats }) ??
    {
      ...session,
      turn: nextTurn,
      stats: updatedStats,
    };

  return { session: updatedSession, event };
}
