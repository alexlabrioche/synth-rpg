import type { Character, Lang } from "@synth-rpg/types";
import { GameEventKind } from "@synth-rpg/types";
import { formatStatsLines } from "../helpers/stats.helpers";

const KIND_GUIDANCE: Record<
  Lang,
  Record<GameEventKind, string>
> = {
  en: {
    [GameEventKind.Opportunity]:
      "A hopeful opening that hints at subtle growth.",
    [GameEventKind.Boon]:
      "An unexpected gift that floods the player with benefit.",
    [GameEventKind.Complication]:
      "A tense twist that forces adaptation or restraint.",
    [GameEventKind.Mutation]:
      "A radical mutation that reconfigures the texture.",
    [GameEventKind.Catastrophe]:
      "A harsh collapse demanding immediate recovery.",
  },
  fr: {
    [GameEventKind.Opportunity]:
      "Une ouverture favorable qui suggère une poussée subtile.",
    [GameEventKind.Boon]:
      "Un cadeau inattendu qui amplifie soudainement l'élan.",
    [GameEventKind.Complication]:
      "Un rebondissement tendu qui impose une adaptation.",
    [GameEventKind.Mutation]:
      "Une métamorphose radicale qui reconfigure la texture.",
    [GameEventKind.Catastrophe]:
      "Un effondrement brutal qui exige une reprise immédiate.",
  },
};

const formatTraits = (traits: string[]): string =>
  traits.length > 0 ? traits.map((t) => `- ${t}`).join("\n") : "- none";

type SessionPromptMode = "prelude" | "turn";

interface GetSystemPromptParams {
  lang: Lang;
}

export const getSessionSystemPrompt = ({
  lang,
}: GetSystemPromptParams) => {
  if (lang === "fr")
    return `
Tu es le maître de jeu d'un RPG musical expérimental.
Tu écris les préludes narratifs et les événements de tour qui guident le joueur.

Règles :
- Ton écriture reste courte, abstraite, poétique.
- Pas de marques ou modèles réels.
- Jamais d'instructions techniques ou de câblage.
`;

  return `
You are a game master for an experimental music RPG.
You craft lore preludes and turn events that guide the player.

Rules:
- Keep the writing short, abstract, and poetic.
- No real-world brand or model names.
- Never give wiring or technical patch instructions.
`;
};

interface GetPreludePromptParams {
  character: Character;
  lang: Lang;
}

export const getSessionPreludeUserPrompt = ({
  character,
  lang,
}: GetPreludePromptParams) => {
  const traits = formatTraits(character.traits);
  const statsLines = formatStatsLines(character.stats);

  if (lang === "fr")
    return `
Personnage :
Nom : ${character.name}
Archétype : ${character.archetype}
Traits :
${traits}

Stats :
${statsLines}

Mission :
Ouvre la campagne sonore en décrivant la scène, l'invitation et le mythe qui entourent ce personnage.
Tisse l'ambiance à partir de ses traits/stats sans donner d'instructions techniques.

Retourne UNIQUEMENT un JSON avec : title, invitation, scene, lore, tone.

Contraintes :
- invitation : 1–2 phrases poétiques qui invitent le joueur à improviser.
- scene : 2–3 phrases sur l'environnement et comment les machines s'éveillent, sans détails techniques.
- lore : un paragraphe court (2–3 phrases) qui relie les stats/traits à une mythologie sonore.
- tone : 3 mots séparés par des virgules qui résument l'humeur.
- Pas de Markdown ni de texte hors JSON.
`;

  return `
Character:
Name: ${character.name}
Archetype: ${character.archetype}
Traits:
${traits}

Stats:
${statsLines}

Your task:
Open the sonic campaign by narrating the scene, the invitation, and the myth surrounding this character.
Use the traits/stats above to hint how their rig awakens, but never describe wiring or exact techniques.

Return ONLY JSON with: title, invitation, scene, lore, tone.

Constraints:
- invitation: 1–2 poetic sentences welcoming the player to play.
- scene: 2–3 sentences painting the environment and awakening of instruments, no technical instructions.
- lore: a short paragraph (2–3 sentences) linking the stats/traits to a sonic myth.
- tone: three evocative words separated by commas summarizing the mood.
- Output must be pure JSON, no Markdown fences.
`;
};

interface GetTurnPromptParams {
  character: Character;
  lang: Lang;
  roll: number;
  kind: GameEventKind;
}

export const getSessionTurnUserPrompt = ({
  character,
  lang,
  roll,
  kind,
}: GetTurnPromptParams) => {
  const traits = formatTraits(character.traits);
  const statsLines = formatStatsLines(character.stats);
  const kindHint = KIND_GUIDANCE[lang][kind];

  if (lang === "fr")
    return `
Personnage :
Nom : ${character.name}
Archétype : ${character.archetype}
Traits :
${traits}

Stats :
${statsLines}

Jet de d20 : ${roll}
Type d'événement attendu : ${kind} — ${kindHint}

Ta mission :
Crée un événement de tour qui décrit comment le joueur doit muter son patch maintenant.
Retourne UNIQUEMENT un JSON avec : title, kind, instructions, constraints, description.

Contraintes :
- Le champ kind DOIT valoir exactement "${kind}".
- instructions : 2–3 phrases directes, imagées, en langage musical (pas de jargons RPG, pas de valeurs numériques, pas de mentions de stats).
- constraints : tableau de 2–3 impératifs courts en termes sonores (aucun chiffre, aucune mention de stats ou d'ajustements techniques).
- description : 2 phrases maximum, atmosphériques.
- Pas de Markdown ni de texte hors JSON.
`;

  return `
Character:
Name: ${character.name}
Archetype: ${character.archetype}
Traits:
${traits}

Stats:
${statsLines}

d20 roll: ${roll}
Desired event kind: ${kind} — ${kindHint}

Your task:
Generate a turn event telling the player how to mutate their patch right now.
Return ONLY raw JSON with: title, kind, instructions, constraints, description.

Constraints:
- The kind field MUST be exactly "${kind}".
- instructions: keep to 2–3 vivid sentences using musical/gestural language (avoid RPG jargon, numbers, or references to stats/knobs—system handles adjustments).
- constraints: array of 2–3 short sonic imperatives, no numbering, no DnD references, no numeric/stat mentions, no precise technical steps.
- description: max 2 sentences, atmospheric.
- Output must be JSON only, no Markdown fences.
`;
};
