import { CharacterStats } from "./character";
import type { LLMTelemetry, ResponseTag, SessionContextLLM } from "./llm";

export type Lang = "en" | "fr";

export enum GamePhase {
  InProgress = "IN_PROGRESS",
  Ended = "ENDED",
}

export interface Session {
  id: string;
  characterId: string;
  lang: Lang;
  turn: number;
  stats: CharacterStats;
  phase: GamePhase;
  createdAt: string;
}

export enum GameEventKind {
  Opportunity = "OPPORTUNITY",
  Boon = "BOON",
  Complication = "COMPLICATION",
  Mutation = "MUTATION",
  Catastrophe = "CATASTROPHE",
}

export interface GameTurnEvent {
  id: string;
  sessionId: string;
  turn: number;
  kind: GameEventKind;
  roll: number;
  title: string;
  narrativeContext: string;
  gearStrategy: string;
  abstractPrompt: string;
  nextHook?: string;
  tags: ResponseTag[];
  telemetry: LLMTelemetry;
  sessionContext?: SessionContextLLM;
}

export interface SessionPrelude {
  id: string;
  sessionId: string;
  title: string;
  narrative: string;
  tone: string;
  instructions: string;
}
