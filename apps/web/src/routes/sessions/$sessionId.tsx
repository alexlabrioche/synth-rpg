import { Button } from "@/components/ui/button";
import { FixedActionBar } from "@/components/fixed-action-bar";
import { useI18n } from "@/i18n";
import { sessionQueryOptions, useSessionQuery } from "@/hooks/useSession";
import {
  sessionEventsQueryOptions,
  useSessionEventsQuery,
} from "@/hooks/useSessionEvents";
import { useAdvanceTurnMutation } from "@/hooks/useAdvanceTurn";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sessions/$sessionId")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      sessionQueryOptions(params.sessionId)
    );
    await context.queryClient.ensureQueryData(
      sessionEventsQueryOptions(params.sessionId)
    );
  },
  component: SessionView,
});

function SessionView() {
  const { sessionId } = Route.useParams();
  const { t } = useI18n();
  const {
    data: sessionDetails,
    isLoading,
    error,
  } = useSessionQuery(sessionId);
  const { data: eventsData } = useSessionEventsQuery(sessionId);
  const { mutate: advanceTurn, isPending: isRolling } =
    useAdvanceTurnMutation();

  if (isLoading) {
    return (
      <div className="container py-16">
        <p className="text-muted-foreground">
          {t("states.loadingSession", "Loading session…")}
        </p>
      </div>
    );
  }

  if (error || !sessionDetails) {
    return (
      <div className="container py-16 space-y-4">
        <p className="text-destructive">
          {t("states.sessionError", "Unable to load this session.")}
        </p>
        <Button variant="outline" asChild>
          <Link to="/">← {t("session.actions.backToCharacter", "Back to characters")}</Link>
        </Button>
      </div>
    );
  }

  const { session, prelude } = sessionDetails;
  const events = eventsData?.events ?? [];

  const handleNextTurn = () => {
    if (isRolling) return;
    advanceTurn({ sessionId: session.id });
  };

  return (
    <>
      <div className="container py-10 pb-32 space-y-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("session.title", "Session")}
            </p>
            <h1 className="text-3xl font-semibold">
              {t("session.meta.turn", "Turn")} {session.turn}
            </h1>
          </div>
          <Button variant="outline" asChild>
            <Link
              to="/characters/$characterId"
              params={{ characterId: session.characterId }}
            >
              ← {t("session.actions.backToCharacter", "Back to character")}
            </Link>
          </Button>
        </header>

        {prelude ? (
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("session.sections.prelude", "Prelude")}
              </p>
              <h2 className="text-2xl font-semibold mt-1">{prelude.title}</h2>
            </div>
            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
              {prelude.narrative}
            </p>
            {prelude.instructions ? (
              <p className="text-sm text-foreground font-medium">
                {prelude.instructions}
              </p>
            ) : null}
          </section>
        ) : null}

        <section className="space-y-4">
          <header className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {t("session.sections.events", "Events")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {events.length} {t("session.sections.eventCount", "entries")}
            </p>
          </header>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t(
                "session.empty.events",
                "No events yet. Roll to awaken the world."
              )}
            </p>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <article
                  key={event.id}
                  className="rounded-2xl border border-border bg-card/80 p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                    <span>{t(`session.events.${event.kind.toLowerCase()}`, event.kind)}</span>
                    <span>{t("session.meta.turn", "Turn")} {event.turn}</span>
                  </div>
                  <h3 className="text-lg font-semibold">{event.title}</h3>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {event.narrative}
                  </p>
                  {event.instructions?.length ? (
                    <ul className="mt-2 list-disc pl-5 text-sm text-foreground space-y-1">
                      {event.instructions.map((instruction, idx) => (
                        <li key={`${event.id}-instruction-${idx}`}>
                          {instruction}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <FixedActionBar
        title={t("session.actions.nextTurnTitle", "Advance the story")}
        description={t(
          "session.actions.nextTurnSubtitle",
          "Roll to discover what the world throws at you next."
        )}
        actionLabel={t("session.actions.rollNext", "Roll next turn")}
        actionLoadingLabel={t(
          "session.actions.rolling",
          "Rolling next turn…"
        )}
        onAction={handleNextTurn}
        disabled={isRolling}
        loading={isRolling}
      />
    </>
  );
}
