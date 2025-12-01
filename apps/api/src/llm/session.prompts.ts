import type { Character, Lang, SessionContextLLM } from "@synth-rpg/types";
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

const SESSION_CONTEXT_COPY: Record<
  Lang,
  {
    header: string;
    goalLabel: string;
    moodLabel: string;
    focusLabel: string;
    gearLabel: string;
    gearEmpty: string;
    movesLabel: string;
    movesEmpty: string;
    capabilityLabel: string;
    capabilityEmpty: string;
    goalFallback: string;
    moodFallback: string;
    focusFallback: string;
  }
> = {
  en: {
    header: "Session context:",
    goalLabel: "Goal",
    moodLabel: "Mood",
    focusLabel: "Focus",
    gearLabel: "Gear summary",
    gearEmpty: "- no declared gear",
    movesLabel: "Recent moves",
    movesEmpty: "- no previous moves",
    capabilityLabel: "Capability tags",
    capabilityEmpty: "none declared",
    goalFallback: "Keep the jam playful.",
    moodFallback: "curious drift",
    focusFallback: "Stay flexible and open.",
  },
  fr: {
    header: "Contexte de session :",
    goalLabel: "Objectif",
    moodLabel: "Humeur",
    focusLabel: "Focal",
    gearLabel: "Résumé du setup",
    gearEmpty: "- aucun équipement déclaré",
    movesLabel: "Mouvements récents",
    movesEmpty: "- aucun mouvement précédent",
    capabilityLabel: "Tags de capacités",
    capabilityEmpty: "aucun tag",
    goalFallback: "Entretiens la jam et l'émerveillement.",
    moodFallback: "curiosité diffuse",
    focusFallback: "Reste souple et ouvert.",
  },
};

const truncate = (value: string | undefined, max = 140) => {
  if (!value) return "";
  return value.length > max ? `${value.slice(0, max - 3)}...` : value;
};

const formatList = (items: string[], emptyLine: string) => {
  if (!items.length) return emptyLine;
  return items.map((item) => `- ${item}`).join("\n");
};

const formatGearBlock = (lang: Lang, context: SessionContextLLM) => {
  if (!context.gear || context.gear.length === 0) {
    return SESSION_CONTEXT_COPY[lang].gearEmpty;
  }

  return context.gear
    .map((gear) => {
      const role = gear.role ? ` (${gear.role})` : "";
      const description = truncate(gear.description, 120);
      const descLine = description ? ` — ${description}` : "";
      const traitLine =
        gear.traits && gear.traits.length
          ? gear.traits.join(", ")
          : lang === "fr"
            ? "aucun trait"
            : "no traits";
      const capabilityLine =
        gear.capabilities && gear.capabilities.length
          ? gear.capabilities.join(", ")
          : lang === "fr"
            ? "aucune capacité"
            : "no capabilities";
      return `- ${gear.name}${role}${descLine}\n  • Traits: ${traitLine}\n  • Capabilities: ${capabilityLine}`;
    })
    .join("\n");
};

const formatSessionContextBlock = (
  lang: Lang,
  context: SessionContextLLM
): string => {
  const copy = SESSION_CONTEXT_COPY[lang];
  const goal = context.goal ?? copy.goalFallback;
  const mood = context.mood ?? copy.moodFallback;
  const focus = context.focus ?? copy.focusFallback;
  const moves = formatList(context.recentMoves ?? [], copy.movesEmpty);
  const capabilityTags =
    (context.capabilityTags ?? []).join(", ") || copy.capabilityEmpty;

  return `
${copy.header}
${copy.goalLabel}: ${goal}
${copy.moodLabel}: ${mood}
${copy.focusLabel}: ${focus}
${copy.gearLabel}:
${formatGearBlock(lang, context)}
${copy.movesLabel}:
${moves}
${copy.capabilityLabel}: ${capabilityTags}
`.trim();
};

interface GetSystemPromptParams {
  lang: Lang;
}

export const getSessionSystemPrompt = ({ lang }: GetSystemPromptParams) => {
  if (lang === "fr")
    return `
Tu es le maître de jeu d'un RPG musical expérimental.
Tu écris les préludes narratifs et les événements de tour en suivant exactement la structure JSON demandée.

Règles :
- Garde un ton court, poétique, absurde, sans jargon technique.
- Ne cite jamais de marques ou modèles réels.
- Respecte la séparation des canaux : le récit reste descriptif, les consignes vivent dans les champs dédiés (gearStrategy, abstractPrompt, etc.).
- Les consignes doivent évoquer les Oblique Strategies : métaphores impératives, sans valeurs numériques ni noms de paramètres.
- Tu dois toujours répondre par UN SEUL objet JSON valide, sans texte avant/après, sans Markdown, sans décoration. Aucune autre sortie n'est autorisée.
`;

  return `
You are a game master for an experimental music RPG.
You craft lore preludes and turn events, always following the exact JSON contract specified in the user prompt.

Rules:
- Keep everything short, poetic, and slightly mischievous.
- Never mention real-world brands or specific model names.
- Keep narrative context purely descriptive; all prompts/instructions must live in their dedicated fields (gearStrategy, abstractPrompt, etc.).
- Guidance should feel like Oblique Strategies: metaphorical, imperative, no numbers or parameter names.
- You MUST reply with a single valid JSON object only—no code fences, no prose before/after, no explanations.
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

Retourne UNIQUEMENT un JSON avec : title, narrative, tone, instructions. Ta réponse doit être un seul objet JSON valide sans aucun texte supplémentaire.

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

Return ONLY JSON with: title, narrative, tone, instructions. The response must be a single JSON object with no extra text or Markdown anywhere.

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
  capabilityHints: string;
  sessionContext: SessionContextLLM;
}

export const getSessionTurnUserPrompt = ({
  character,
  lang,
  roll,
  kind,
  capabilityHints,
  sessionContext,
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

Capacités disponibles :
${capabilityHints}

Contexte :
${formatSessionContextBlock(lang, sessionContext)}

Jet de d20 : ${roll}
Type d'événement : ${kind} — ${kindHint}

Ta mission :
Crée un événement simple qui inspire le joueur.

Ta réponse DOIT être exactement UN objet JSON valide, rien d'autre (pas de texte avant/après, pas de Markdown).

Champs obligatoires :
- title : titre évocateur ≤ 6 mots.
- narrative : une seule phrase à la troisième personne décrivant la scène.
- gearStrategy : une phrase qui mentionne au moins une capacité listée plus haut (sans jargon technique).
- abstractPrompt : une phrase courte (≤ 14 mots) façon Oblique Strategy, sans mention de capacités.

Contraintes supplémentaires :
- Pas de marques ou modèles réels.
- Pas de chiffres, BPM, CV, ni instructions techniques précises.
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

Session context:
${formatSessionContextBlock(lang, sessionContext)}

d20 roll: ${roll}
Event kind: ${kind} — ${kindHint}

Your task:
Write a concise event that keeps the story and the cue separate.

You MUST reply with exactly one valid JSON object and nothing else.

Fields:
- title: evocative ≤ 6 words.
- narrative: one third-person sentence describing the current scene (no imperatives).
- gearStrategy: one sentence referencing at least one capability label from the list (no technical numbers).
- abstractPrompt: one short oblique-strategy style sentence (≤ 14 words) with metaphorical language, no capability names.

Additional rules:
- No real-world brands/models.
- No BPM/CV/numeric settings.
- No Markdown or commentary outside the JSON object.
`;
};
