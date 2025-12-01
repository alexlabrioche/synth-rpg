import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { characterQueryOptions, useCharacterQuery } from "@/hooks/useCharacter";
import { capabilityTranslationsToBatch, useI18n } from "@/i18n";
import {
  capabilitiesQueryOptions,
  useCapabilitiesQuery,
} from "@/hooks/useCapabilitiesQuery";
import type { CharacterStats } from "@synth-rpg/types";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/characters/$characterId")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      characterQueryOptions(params.characterId)
    );
    await context.queryClient.ensureQueryData(capabilitiesQueryOptions());
  },
  component: CharacterDetails,
});

function CharacterDetails() {
  const { characterId } = Route.useParams();
  const { data: character, isLoading, error } = useCharacterQuery(characterId);
  const { t, extend, lang } = useI18n();
  const { data: capabilitiesData } = useCapabilitiesQuery();

  useEffect(() => {
    if (!capabilitiesData?.translations) {
      return;
    }
    extend(capabilityTranslationsToBatch(capabilitiesData.translations));
  }, [capabilitiesData?.translations, extend]);

  if (isLoading) {
    return (
      <div className="container py-16">
        <p className="text-muted-foreground">
          {t("states.loadingCharacter", "Loading character…")}
        </p>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="container py-16 space-y-4">
        <p className="text-destructive">
          {t("states.characterError", "Unable to load character.")}
        </p>
        <Button asChild variant="outline">
          <Link to="/">
            ← {t("character.actions.back", "Back to selection")}
          </Link>
        </Button>
      </div>
    );
  }

  const statsEntries = Object.entries(character.stats ?? {}) as [
    keyof CharacterStats,
    number,
  ][];

  return (
    <div className="container py-10 space-y-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("character.title", "Character sheet")}
          </p>
          <h1 className="text-4xl font-bold mt-1">{character.name}</h1>
          <p className="text-muted-foreground">{character.archetype}</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/">
            ← {t("character.actions.back", "Back to selection")}
          </Link>
        </Button>
      </header>

      <section className="grid gap-8 md:grid-cols-[2fr,1fr]">
        <article className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h2 className="text-xl font-semibold">
            {t("character.sections.story", "Story")}
          </h2>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
            {character.description}
          </p>
          {character.traits?.length ? (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t("character.sections.traits", "Traits")}
              </h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1">
                {character.traits.map((trait) => (
                  <li key={trait}>{trait}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </article>

        <article className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h2 className="text-xl font-semibold">
            {t("character.sections.stats", "Stats")}
          </h2>
          <ul className="space-y-3">
            {statsEntries.map(([stat, value]) => (
              <li key={stat}>
                <p className="text-sm font-medium">
                  {t(`character.stats.${stat}`, stat)}
                </p>
                <div className="mt-1 h-2 rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full bg-primary transition-all",
                      value >= 8
                        ? "bg-primary"
                        : value >= 5
                          ? "bg-primary/80"
                          : "bg-primary/60"
                    )}
                    style={{ width: `${Math.min(100, (value / 10) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {value}/10
                </p>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-semibold">
            {t("character.sections.capabilities", "Capabilities")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {character.capabilities.length}{" "}
            {t("character.sections.capabilityCountLabel", "total")}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {character.capabilities.map((capability) => (
            <article
              key={capability.id}
              className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm"
            >
              <h3 className="text-lg font-semibold">
                {t(capability.label, capability.slug)}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {t(capability.description, "")}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
