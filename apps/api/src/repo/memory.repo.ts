import type { Character, Session, GameEvent, SessionPrelude } from "@synth-rpg/types";
import { loadStore, saveStore } from "./json.store";

const characters = new Map<string, Character>();
const sessions = new Map<string, Session>();
const events = new Map<string, GameEvent>();
const preludes = new Map<string, SessionPrelude>();

const bootstrap = () => {
  const initial = loadStore();
  initial.characters.forEach((c) => characters.set(c.id, c));
  initial.sessions.forEach((s) => sessions.set(s.id, s));
  initial.events.forEach((e) => events.set(e.id, e));
  initial.preludes?.forEach((p) => preludes.set(p.id, p));
};

const persist = () => {
  saveStore({
    characters: Array.from(characters.values()),
    sessions: Array.from(sessions.values()),
    events: Array.from(events.values()),
    preludes: Array.from(preludes.values()),
  });
};

bootstrap();

export const characterRepo = {
  save(character: Character) {
    characters.set(character.id, character);
    persist();
    return character;
  },
  get(id: string) {
    return characters.get(id) ?? null;
  },
  getAll() {
    return Array.from(characters.values());
  },
};

export const sessionRepo = {
  save(session: Session) {
    sessions.set(session.id, session);
    persist();
    return session;
  },
  get(id: string) {
    return sessions.get(id) ?? null;
  },
  getAll() {
    return Array.from(sessions.values());
  },
  update(id: string, patch: Partial<Session>) {
    const current = sessions.get(id);
    if (!current) return null;
    const updated = { ...current, ...patch };
    sessions.set(id, updated);
    persist();
    return updated;
  },
};

export const eventRepo = {
  save(event: GameEvent) {
    events.set(event.id, event);
    persist();
    return event;
  },
  getBySession(sessionId: string) {
    return Array.from(events.values()).filter((e) => e.sessionId === sessionId);
  },
};

export const preludeRepo = {
  save(prelude: SessionPrelude) {
    preludes.set(prelude.id, prelude);
    persist();
    return prelude;
  },
  getBySession(sessionId: string) {
    return Array.from(preludes.values()).find((p) => p.sessionId === sessionId);
  },
};
