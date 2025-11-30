import type { Character, Lang } from "@synth-rpg/types";
import { GameEventKind } from "@synth-rpg/types";
import { formatStatsLines } from "../helpers/stats.helpers";

const KIND_GUIDANCE: Record<Lang, Record<GameEventKind, string>> = {
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

export const getSessionSystemPrompt = ({ lang }: GetSystemPromptParams) => {
  if (lang === "fr")
    return `
Tu es le maître de jeu d'un RPG musical expérimental.
Tu écris les préludes narratifs et les événements de tour qui guident le joueur.

Règles :
- Ton écriture reste courte, abstraite, poétique.
- Pas de marques ou modèles réels.
- Jamais d'instructions techniques ou de câblage.
- Les directives doivent évoquer les Oblique Strategies : impératifs surréalistes sans mention de boutons ou paramètres.
`;

  return `
You are a game master for an experimental music RPG.
You craft lore preludes and turn events that guide the player.

Rules:
- Keep the writing short, abstract, and poetic.
- No real-world brand or model names.
- Never give wiring or technical patch instructions.
- Directives must feel like Oblique Strategies: surreal, imperative, never literal knob/parameter talk.
`;
};

interface GetPreludePromptParams {
  character: Character;
  lang: Lang;
  capabilityHints: string;
}

export const getSessionPreludeUserPrompt = ({
  character,
  lang,
  capabilityHints,
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

Capacités possibles :
${capabilityHints}

Mission :
Ouvre la campagne sonore en décrivant une scène unique et le mythe qui entourent ce personnage.
Tisse ton récit à partir de ses traits/stats et des capacités listées ci-dessus sans donner d'instructions techniques.

Retourne UNIQUEMENT un JSON avec : title, narrative, tone, instructions.

Contraintes :
- Pas de Markdown ni de texte hors JSON.
- narrative : 3–4 phrases cohérentes (pas de listes) qui mêlent ambiance, lieu et légende sonore. Référence au moins une stat et une capacité, sans détailler de patch.
- tone : 3 mots séparés par des virgules qui résument l'humeur.
- instructions : exactement deux phrases impératives.
  - La première commence par « Commence avec » et doit citer STRICTEMENT un label de capacité (sans description).
  - La seconde commence par « Puis » et doit faire référence à une AUTRE capacité ou stat de façon abstraite, sans chiffres.
  - Chaque phrase ≤ 18 mots, abstraite mais exploitable, sans réglages techniques ni valeurs numériques.
`;

  return `
Character:
Name: ${character.name}
Archetype: ${character.archetype}
Traits:
${traits}

Stats:
${statsLines}

Available capabilities:
${capabilityHints}

Your task:
Open the sonic campaign by narrating a single cohesive scene and myth for this character.
Use the traits/stats and capabilities above to describe how their world awakens, but never describe wiring or exact techniques.

Return ONLY JSON with: title, narrative, tone, instructions.

Constraints:
- Output must be pure JSON, no Markdown fences.
- narrative: 3–4 complete sentences (no bullet lists) blending ambience, place, and legend. Reference at least one stat and one capability label, but stay poetic.
- tone: three evocative words separated by commas summarizing the mood.
- instructions: exactly two imperative sentences.
  - The first must start with “Start with” and quote exactly one capability label (no description, no extra text).
  - The second must start with “Then” and refer to a DIFFERENT capability or stat in an abstract way, without numbers.
  - Each sentence ≤ 18 words, abstract yet usable, no technical values, no numeric stat levels.
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
Type d'événement : ${kind} — ${kindHint}

Ta mission :
Crée un événement de tour immersif qui décrit ce qui se passe MAINTENANT dans le monde sonore du personnage,
et comment le joueur doit muter son patch pour répondre à cette situation.

Retourne UNIQUEMENT un JSON avec : title, narrative, tone, instructions.

Contraintes sur les champs :
- title : un titre court et évocateur (max 6 mots), sans chiffres.
- narrative : 2–3 phrases continues (pas de listes) décrivant une petite scène précise, reliée au type d'événement.
  • Fais ressentir une tension ou un basculement (surtout pour ${kind}).
  • Évite le jargon technique : parle d'espaces, de matières, de gestes sonores.
- tone : exactement trois mots séparés par des virgules qui résument l'humeur du moment.
- instructions : tableau de 3 phrases impératives courtes (max 14 mots chacune).
  • La première phrase demande une transformation active (mutation, déplacement, renversement).
  • La deuxième impose une limite ou un évitement (ce qu'il faut retenir, contenir, taire).
  • La troisième propose une légère transgression d'une règle implicite ou précédente.
  • Jamais de boutons, paramètres, BPM, mesures, câbles, ni chiffres.

Sortie : uniquement le JSON, aucun Markdown, aucun texte hors JSON.
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
Event kind: ${kind} — ${kindHint}

Your task:
Create an immersive turn event that describes what is happening RIGHT NOW in the character's sonic world,
and how the player should mutate the patch in response.

Return ONLY raw JSON with: title, narrative, tone, instructions.

Field constraints:
- title: short, evocative title (max 6 words), no numbers.
- narrative: 2–3 continuous sentences (no lists) describing a specific small scene tied to the event kind.
  • Convey a sense of tension or shift (especially for ${kind}).
  • Avoid technical jargon: speak in terms of space, texture, movement, gestures.
- tone: exactly three words separated by commas that summarize the current mood.
- instructions: array of 3 short imperative sentences (max 14 words each).
  • First sentence calls for an active transformation (mutation, inversion, displacement).
  • Second sentence sets a clear limitation or avoidance (what must be held back or ignored).
  • Third sentence invites a gentle breaking of an implied or previous rule.
  • Never mention knobs, parameters, BPM, meters, cables, or numbers.

Output must be JSON only, no Markdown fences.
`;
};
