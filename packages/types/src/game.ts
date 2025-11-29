import { CharacterStats } from "./character";

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

export interface GameEvent {
  id: string;
  sessionId: string;
  turn: number;
  kind: GameEventKind;
  roll: number;
  title: string;
  instructions: string;
  constraints: string[];
  description: string;
}

export interface SessionPrelude {
  id: string;
  sessionId: string;
  title: string;
  invitation: string;
  scene: string;
  lore: string;
  tone: string;
}
