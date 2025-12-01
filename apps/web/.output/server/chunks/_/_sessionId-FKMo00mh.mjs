import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { B as Button, F as FixedActionBar } from "./fixed-action-bar-BZpJbPvX.mjs";
import { e as Route$1, u as useI18n, f as useSessionQuery, g as useSessionEventsQuery, a as apiClient, s as sessionQueryKey, d as sessionEventsQueryKey } from "./router-Bc4_mOuw.mjs";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "react";
import "@tanstack/react-router-ssr-query";
const useAdvanceTurnMutation = (options) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = {};
  return useMutation({
    mutationFn: ({ sessionId }) => apiClient.post(`/sessions/${sessionId}/turns`),
    onSuccess: (result, variables, context, mutation) => {
      queryClient.setQueryData(
        sessionQueryKey(variables.sessionId),
        (prev) => ({
          session: result.session,
          prelude: prev?.prelude ?? null
        })
      );
      queryClient.setQueryData(
        sessionEventsQueryKey(variables.sessionId),
        (prev) => ({
          events: [...prev?.events ?? [], result.event]
        })
      );
      onSuccess?.(result, variables, context, mutation);
    },
    ...restOptions
  });
};
function SessionView() {
  const {
    sessionId
  } = Route$1.useParams();
  const {
    t
  } = useI18n();
  const {
    data: sessionDetails,
    isLoading,
    error
  } = useSessionQuery(sessionId);
  const {
    data: eventsData
  } = useSessionEventsQuery(sessionId);
  const {
    mutate: advanceTurn,
    isPending: isRolling
  } = useAdvanceTurnMutation();
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "container py-16", children: /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: t("states.loadingSession", "Loading session…") }) });
  }
  if (error || !sessionDetails) {
    return /* @__PURE__ */ jsxs("div", { className: "container py-16 space-y-4", children: [
      /* @__PURE__ */ jsx("p", { className: "text-destructive", children: t("states.sessionError", "Unable to load this session.") }),
      /* @__PURE__ */ jsx(Button, { variant: "outline", asChild: true, children: /* @__PURE__ */ jsxs(Link, { to: "/", children: [
        "← ",
        t("session.actions.backToCharacter", "Back to characters")
      ] }) })
    ] });
  }
  const {
    session,
    prelude
  } = sessionDetails;
  const events = eventsData?.events ?? [];
  const handleNextTurn = () => {
    if (isRolling) return;
    advanceTurn({
      sessionId: session.id
    });
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "container py-10 pb-32 space-y-10", children: [
      /* @__PURE__ */ jsxs("header", { className: "flex flex-wrap items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: t("session.title", "Session") }),
          /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-semibold", children: [
            t("session.meta.turn", "Turn"),
            " ",
            session.turn
          ] })
        ] }),
        /* @__PURE__ */ jsx(Button, { variant: "outline", asChild: true, children: /* @__PURE__ */ jsxs(Link, { to: "/characters/$characterId", params: {
          characterId: session.characterId
        }, children: [
          "← ",
          t("session.actions.backToCharacter", "Back to character")
        ] }) })
      ] }),
      prelude ? /* @__PURE__ */ jsxs("section", { className: "rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: t("session.sections.prelude", "Prelude") }),
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold mt-1", children: prelude.title })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground whitespace-pre-line leading-relaxed", children: prelude.narrative }),
        prelude.instructions ? /* @__PURE__ */ jsx("p", { className: "text-sm text-foreground font-medium", children: prelude.instructions }) : null
      ] }) : null,
      /* @__PURE__ */ jsxs("section", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("header", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: t("session.sections.events", "Events") }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
            events.length,
            " ",
            t("session.sections.eventCount", "entries")
          ] })
        ] }),
        events.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: t("session.empty.events", "No events yet. Roll to awaken the world.") }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: events.map((event) => /* @__PURE__ */ jsxs("article", { className: "rounded-2xl border border-border bg-card/80 p-5 shadow-sm space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground", children: [
            /* @__PURE__ */ jsx("span", { children: t(`session.events.${event.kind.toLowerCase()}`, event.kind) }),
            /* @__PURE__ */ jsxs("span", { children: [
              t("session.meta.turn", "Turn"),
              " ",
              event.turn
            ] })
          ] }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: event.title }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground whitespace-pre-line", children: event.narrativeContext }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-3 pt-3 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-muted/20 p-3", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: t("session.events.gearStrategy", "Gear cue") }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-foreground", children: event.gearStrategy })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-muted/20 p-3", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: t("session.events.abstractPrompt", "Abstract prompt") }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-foreground", children: event.abstractPrompt })
            ] })
          ] }),
          event.nextHook ? /* @__PURE__ */ jsxs("p", { className: "text-sm italic text-muted-foreground", children: [
            t("session.events.nextHook", "Next hook:"),
            " ",
            /* @__PURE__ */ jsx("span", { className: "text-foreground", children: event.nextHook })
          ] }) : null,
          event.tags?.length ? /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2 pt-2", children: event.tags.map((tag, idx) => /* @__PURE__ */ jsxs("span", { className: "rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-muted-foreground", children: [
            tag.type ? /* @__PURE__ */ jsx("span", { className: "uppercase tracking-wide text-[10px] mr-1", children: tag.type }) : null,
            /* @__PURE__ */ jsx("span", { className: "text-foreground font-medium", children: tag.value })
          ] }, `${event.id}-tag-${idx}`)) }) : null
        ] }, event.id)) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(FixedActionBar, { title: t("session.actions.nextTurnTitle", "Advance the story"), description: t("session.actions.nextTurnSubtitle", "Roll to discover what the world throws at you next."), actionLabel: t("session.actions.rollNext", "Roll next turn"), actionLoadingLabel: t("session.actions.rolling", "Rolling next turn…"), onAction: handleNextTurn, disabled: isRolling, loading: isRolling })
  ] });
}
export {
  SessionView as component
};
