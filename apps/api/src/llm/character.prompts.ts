import type { CharacterStats, Lang } from "@synth-rpg/types";
import { formatStatsLines } from "../helpers/stats.helpers";

interface GetSystemPromptParams {
  lang: Lang;
}

export const getSystemPrompt = ({ lang }: GetSystemPromptParams) => {
  if (lang === "fr")
    return `
Tu es le maître de jeu d'un RPG musical expérimental.
Tu crées des personnages reflétant les capacités matérielles du joueur et des statistiques abstraites.

Règles :
- Pas de marques ou modèles réels.
- Pas d'instructions techniques de patch.
- Concentre-toi sur l'humeur, les tendances et la personnalité sonore.
`;

  return `
You are a game master for an experimental music RPG.
You create characters that reflect the player's hardware capabilities and abstract stats.

Rules:
- Avoid gear brands and model names.
- Avoid technical patch instructions.
- Focus on mood, tendencies, and personality related to sound.
`;
};

interface GetUserPromptParams {
  capabilitySummaries: string;
  stats: CharacterStats;
  lang: Lang;
}

export const getUserPrompt = ({
  capabilitySummaries,
  stats,
  lang,
}: GetUserPromptParams) => {
  const statsLines = formatStatsLines(stats);

  if (lang === "fr")
    return `
Capacités :
${capabilitySummaries}

Statistiques :
${statsLines}

Crée un personnage qui incarne ces propriétés.
Retourne un JSON avec : name, archetype, traits, description.

Contraintes :
- Le nom doit être UNIQUE, évocateur, créatif, et ne doit jamais reprendre les noms de capacités.
- L'archétype doit être POÉTIQUE et ORIGINAL (1–2 mots), pas des termes génériques.
- Les traits doivent être CRÉATIFS et ABSTRAITS, jamais des noms techniques (pas "LFO", "Granular Engine", etc.).
- Garde tout court et évocateur.
- Pour la description, limite à 3–4 phrases.
`;

  return `
Capabilities:
${capabilitySummaries}

Stats:
${statsLines}

Create a character that embodies these properties.
Return a JSON object with: name, archetype, traits, description.

Constraints:
- Name MUST be UNIQUE, evocative, creative, and must NOT reuse capability names.
- Archetype MUST be POETIC and ORIGINAL (1–2 words), not generic terms.
- Traits MUST be CREATIVE and ABSTRACT, never technical labels (no "LFO", no "Granular Engine", etc.).
- Keep everything short and evocative.
- Limit the description to 3–4 sentences.
`;
};
