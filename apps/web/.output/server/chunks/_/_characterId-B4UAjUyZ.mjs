import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { B as Button, c as cn, F as FixedActionBar } from "./fixed-action-bar-BZpJbPvX.mjs";
import { h as Route, i as useCharacterQuery, u as useI18n, b as useCapabilitiesQuery, a as apiClient, s as sessionQueryKey } from "./router-Bc4_mOuw.mjs";
import { c as capabilityTranslationsToBatch } from "./utils-CvD0Mxry.mjs";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@tanstack/react-router-ssr-query";
const useStartSessionMutation = (options) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};
  return useMutation({
    mutationFn: (input) => apiClient.post("/sessions", input),
    onSuccess: (result, variables, context, mutation) => {
      queryClient.setQueryData(sessionQueryKey(result.session.id), {
        session: result.session,
        prelude: result.prelude
      });
      onSuccess?.(result, variables, context, mutation);
    },
    ...restOptions
  });
};
function CharacterDetails() {
  const {
    characterId
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    data: character,
    isLoading,
    error
  } = useCharacterQuery(characterId);
  const {
    t,
    extend,
    lang
  } = useI18n();
  const {
    data: capabilitiesData
  } = useCapabilitiesQuery();
  const {
    mutate: startSession,
    isPending: isStarting
  } = useStartSessionMutation({
    onSuccess: ({
      session
    }) => {
      navigate({
        to: "/sessions/$sessionId",
        params: {
          sessionId: session.id
        }
      });
    }
  });
  useEffect(() => {
    if (!capabilitiesData?.translations) {
      return;
    }
    extend(capabilityTranslationsToBatch(capabilitiesData.translations));
  }, [capabilitiesData?.translations, extend]);
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "container py-16", children: /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: t("states.loadingCharacter", "Loading character…") }) });
  }
  if (error || !character) {
    return /* @__PURE__ */ jsxs("div", { className: "container py-16 space-y-4", children: [
      /* @__PURE__ */ jsx("p", { className: "text-destructive", children: t("states.characterError", "Unable to load character.") }),
      /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsxs(Link, { to: "/", children: [
        "← ",
        t("character.actions.back", "Back to selection")
      ] }) })
    ] });
  }
  const statsEntries = Object.entries(character.stats ?? {});
  const handleStartAdventure = () => {
    if (isStarting) return;
    startSession({
      characterId: character.id,
      lang
    });
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "container py-10 pb-32 space-y-10", children: [
      /* @__PURE__ */ jsxs("header", { className: "flex flex-wrap items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: t("character.title", "Character sheet") }),
          /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold mt-1", children: character.name }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: character.archetype })
        ] }),
        /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsxs(Link, { to: "/", children: [
          "← ",
          t("character.actions.back", "Back to selection")
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "grid gap-8 md:grid-cols-[2fr,1fr]", children: [
        /* @__PURE__ */ jsxs("article", { className: "rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: t("character.sections.story", "Story") }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground leading-relaxed whitespace-pre-line", children: character.description }),
          character.traits?.length ? /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold uppercase tracking-wide text-muted-foreground", children: t("character.sections.traits", "Traits") }),
            /* @__PURE__ */ jsx("ul", { className: "mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1", children: character.traits.map((trait) => /* @__PURE__ */ jsx("li", { children: trait }, trait)) })
          ] }) : null
        ] }),
        /* @__PURE__ */ jsxs("article", { className: "rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: t("character.sections.stats", "Stats") }),
          /* @__PURE__ */ jsx("ul", { className: "space-y-3", children: statsEntries.map(([stat, value]) => /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: t(`character.stats.${stat}`, stat) }),
            /* @__PURE__ */ jsx("div", { className: "mt-1 h-2 rounded-full bg-muted", children: /* @__PURE__ */ jsx("div", { className: cn("h-full rounded-full bg-primary transition-all", value >= 8 ? "bg-primary" : value >= 5 ? "bg-primary/80" : "bg-primary/60"), style: {
              width: `${Math.min(100, value / 10 * 100)}%`
            } }) }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground mt-0.5", children: [
              value,
              "/10"
            ] })
          ] }, stat)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between flex-wrap gap-3", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: t("character.sections.capabilities", "Capabilities") }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
            character.capabilities.length,
            " ",
            t("character.sections.capabilityCountLabel", "total")
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid gap-4 md:grid-cols-2", children: character.capabilities.map((capability) => /* @__PURE__ */ jsxs("article", { className: "rounded-2xl border border-border bg-card/80 p-4 shadow-sm", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: t(capability.label, capability.slug) }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-2", children: t(capability.description, "") })
        ] }, capability.id)) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(FixedActionBar, { title: t("character.actions.readyTitle", "Ready to begin?"), description: t("character.actions.readySubtitle", "Your synth is tuned. Start the adventure when you are."), actionLabel: t("character.actions.startAdventure", "Start adventure"), actionLoadingLabel: t("character.actions.startingAdventure", "Summoning the opening scene…"), onAction: handleStartAdventure, disabled: isStarting, loading: isStarting }),
    isStarting && /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur", children: [
      /* @__PURE__ */ jsx("div", { className: "h-16 w-16 rounded-full border-4 border-muted border-t-primary animate-spin" }),
      /* @__PURE__ */ jsxs("div", { className: "text-center space-y-1", children: [
        /* @__PURE__ */ jsx("p", { className: "text-base font-semibold", children: t("character.actions.startingAdventure", "Summoning the opening scene…") }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: t("states.loadingCharacter", "Loading character…") })
      ] })
    ] })
  ] });
}
export {
  CharacterDetails as component
};
