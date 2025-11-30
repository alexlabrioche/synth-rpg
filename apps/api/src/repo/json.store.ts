import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import type {
  Character,
  Session,
  GameTurnEvent,
  SessionPrelude,
} from "@synth-rpg/types";

const DATA_FILE = join(process.cwd(), "data.json");

interface StoreShape {
  characters: Character[];
  sessions: Session[];
  events: GameTurnEvent[];
  preludes: SessionPrelude[];
}

export function loadStore(): StoreShape {
  if (!existsSync(DATA_FILE)) {
    return { characters: [], sessions: [], events: [], preludes: [] };
  }
  const raw = readFileSync(DATA_FILE, "utf-8");
  const parsed = JSON.parse(raw) as Partial<StoreShape>;
  return {
    characters: parsed.characters ?? [],
    sessions: parsed.sessions ?? [],
    events: parsed.events ?? [],
    preludes: parsed.preludes ?? [],
  };
}

export function saveStore(data: StoreShape) {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}
