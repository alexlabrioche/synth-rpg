import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect, useMemo, useCallback } from "react";
import { B as Button, F as FixedActionBar, c as cn } from "./fixed-action-bar-BZpJbPvX.mjs";
import { b as useCapabilitiesQuery, u as useI18n, R as Route$2, a as apiClient, c as characterQueryKey } from "./router-Bc4_mOuw.mjs";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { c as capabilityTranslationsToBatch } from "./utils-CvD0Mxry.mjs";
import { z } from "zod";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@tanstack/react-router";
import "@tanstack/react-router-ssr-query";
function useLocalStorage(key, initialValue) {
  const readValue = useCallback(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        return JSON.parse(item);
      }
    } catch {
    }
    return initialValue;
  }, [initialValue, key]);
  const [storedValue, setStoredValue] = useState(readValue);
  const setValue = useCallback(
    (value) => {
      setStoredValue((prev) => {
        const nextValue = value instanceof Function ? value(prev) : value;
        try {
          if (typeof window !== "undefined") {
            window.localStorage.setItem(key, JSON.stringify(nextValue));
          }
        } catch {
        }
        return nextValue;
      });
    },
    [key]
  );
  return [storedValue, setValue];
}
const LANG_OPTIONS = [
  { value: "en", label: "EN" },
  { value: "fr", label: "FR" }
];
function LangSwitcher() {
  const { lang, setLang } = useI18n();
  const [, setPersistedLang] = useLocalStorage("lang", lang);
  const handleSelect = (nextLang) => {
    setLang(nextLang);
    setPersistedLang(nextLang);
  };
  return /* @__PURE__ */ jsx("div", { className: "inline-flex items-center gap-2", role: "group", "aria-label": "Language selector", children: LANG_OPTIONS.map((option) => /* @__PURE__ */ jsx(
    Button,
    {
      type: "button",
      variant: lang === option.value ? "default" : "outline",
      size: "sm",
      onClick: () => handleSelect(option.value),
      "aria-pressed": lang === option.value,
      children: option.label
    },
    option.value
  )) });
}
const CHARACTERS_QUERY_KEY = ["characters"];
const useCreateCharacterMutation = (options) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};
  return useMutation({
    mutationFn: (input) => apiClient.post("/characters", input),
    onSuccess: (character, variables, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: CHARACTERS_QUERY_KEY });
      queryClient.setQueryData(characterQueryKey(character.id), character);
      onSuccess?.(character, variables, context, mutation);
    },
    ...restOptions
  });
};
var CapabilityCategory = /* @__PURE__ */ ((CapabilityCategory2) => {
  CapabilityCategory2["Oscillator"] = "oscillator";
  CapabilityCategory2["Modulation"] = "modulation";
  CapabilityCategory2["Fx"] = "fx";
  CapabilityCategory2["Control"] = "control";
  CapabilityCategory2["Sequencer"] = "sequencer";
  return CapabilityCategory2;
})(CapabilityCategory || {});
const capabilitySchema = z.object({
  id: z.string(),
  slug: z.string(),
  category: z.nativeEnum(CapabilityCategory),
  label: z.string(),
  description: z.string()
});
const statSchema = z.number().int().min(0).max(10);
const characterStatsSchema = z.object({
  density: statSchema,
  chaos: statSchema,
  stability: statSchema,
  percussiveness: statSchema,
  expressivity: statSchema,
  spatiality: statSchema
});
z.object({
  id: z.string(),
  name: z.string(),
  archetype: z.string(),
  traits: z.array(z.string()),
  stats: characterStatsSchema,
  capabilities: z.array(capabilitySchema),
  description: z.string()
});
var GameEventKind = /* @__PURE__ */ ((GameEventKind2) => {
  GameEventKind2["Opportunity"] = "OPPORTUNITY";
  GameEventKind2["Boon"] = "BOON";
  GameEventKind2["Complication"] = "COMPLICATION";
  GameEventKind2["Mutation"] = "MUTATION";
  GameEventKind2["Catastrophe"] = "CATASTROPHE";
  return GameEventKind2;
})(GameEventKind || {});
const stringField = z.string();
const stringArrayField = z.array(stringField);
[
  GameEventKind.Opportunity,
  GameEventKind.Boon,
  GameEventKind.Complication,
  GameEventKind.Mutation,
  GameEventKind.Catastrophe
];
const LLMTagSchema = z.object({
  type: stringField,
  value: stringField
});
const tagsSchema = z.array(LLMTagSchema).optional();
const LLMTelemetrySchema = z.object({
  model: stringField.optional(),
  templateVersion: stringField.optional(),
  source: stringField.optional(),
  latencyMs: z.number().int().nonnegative().optional(),
  warnings: stringArrayField.optional()
});
const sessionContextGearSchema = z.object({
  name: stringField,
  role: stringField.optional(),
  description: stringField.optional(),
  capabilities: stringArrayField.optional(),
  traits: stringArrayField.optional()
});
const SessionContextSchema = z.object({
  goal: stringField.optional(),
  mood: stringField.optional(),
  focus: stringField.optional(),
  location: stringField.optional(),
  gear: z.array(sessionContextGearSchema).optional(),
  recentMoves: stringArrayField.optional(),
  capabilityTags: stringArrayField.optional()
});
z.object({
  title: stringField,
  narrative: stringField,
  gearStrategy: stringField,
  abstractPrompt: stringField,
  nextHook: stringField.optional(),
  sessionContext: SessionContextSchema.optional(),
  tags: tagsSchema,
  telemetry: LLMTelemetrySchema.partial()
}).passthrough();
z.object({
  title: stringField,
  narrative: stringField,
  tone: stringField,
  instructions: stringField
});
z.object({
  name: z.string(),
  archetype: z.string(),
  traits: z.array(z.string()).min(1),
  description: z.string()
});
const CATEGORY_FOLDER_MAP = {
  [CapabilityCategory.Oscillator]: "audio-sources",
  [CapabilityCategory.Modulation]: "cv-sources",
  [CapabilityCategory.Fx]: "audio-modifiers",
  [CapabilityCategory.Control]: "cv-modifiers",
  [CapabilityCategory.Sequencer]: null
};
const FALLBACK_ICON = "/tanstack-circle-logo.png";
function CapabilityItem({
  capability,
  selected,
  onToggle,
  translate
}) {
  const iconFolder = CATEGORY_FOLDER_MAP[capability.category];
  const iconSrc = iconFolder ? `/assets/${iconFolder}/${capability.slug}.png` : FALLBACK_ICON;
  const label = translate(capability.label, capability.slug);
  return /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      onClick: () => onToggle(capability),
      "aria-pressed": selected,
      className: cn(
        "rounded-xl border bg-card p-2 text-left shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:shadow-xl w-full",
        selected ? "border-primary shadow-primary/30 ring-1 ring-primary/70" : "border-border hover:border-primary/50 hover:shadow-md"
      ),
      children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
        /* @__PURE__ */ jsx(
          "img",
          {
            src: iconSrc,
            alt: label,
            className: "size-12 object-cover",
            loading: "lazy"
          }
        ),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: label }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-2", children: translate(capability.description, "") })
        ] })
      ] })
    }
  );
}
function CapabilityList({
  capabilities,
  selectedMap,
  onToggle,
  translate
}) {
  if (!capabilities?.length) {
    return null;
  }
  return /* @__PURE__ */ jsx("div", { className: "grid gap-3 md:grid-cols-2 lg:grid-cols-3", children: capabilities.map((capability) => /* @__PURE__ */ jsx(
    CapabilityItem,
    {
      capability,
      selected: Boolean(selectedMap[capability.id]),
      onToggle,
      translate
    },
    capability.id
  )) });
}
function SelectionBar({
  selectionTitle,
  selectionEmptyText,
  totalLabel,
  selectedCount,
  categoryEntries,
  categoryLabels,
  creating,
  onCreate,
  actionLabel,
  actionLoadingLabel,
  disabled
}) {
  const details = selectedCount > 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3 text-xs text-muted-foreground", children: [
    /* @__PURE__ */ jsxs("span", { className: "font-semibold text-foreground", children: [
      totalLabel,
      ": ",
      selectedCount
    ] }),
    categoryEntries.map(([category, count]) => /* @__PURE__ */ jsxs("span", { children: [
      categoryLabels[category],
      ": ",
      count
    ] }, category))
  ] }) : void 0;
  return /* @__PURE__ */ jsx(
    FixedActionBar,
    {
      title: selectionTitle,
      description: selectedCount > 0 ? void 0 : selectionEmptyText,
      details,
      actionLabel,
      actionLoadingLabel,
      onAction: onCreate,
      disabled,
      loading: creating
    }
  );
}
function App() {
  const {
    data
  } = useCapabilitiesQuery();
  const {
    lang,
    t,
    extend
  } = useI18n();
  const navigate = Route$2.useNavigate();
  const [selected, setSelected] = useState({});
  const {
    mutate: createCharacter,
    isPending: isCreating
  } = useCreateCharacterMutation({
    onSuccess: (character) => {
      setSelected({});
      navigate({
        to: "/characters/$characterId",
        params: {
          characterId: character.id
        }
      });
    }
  });
  useEffect(() => {
    if (!data?.translations) {
      return;
    }
    extend(capabilityTranslationsToBatch(data.translations));
  }, [data?.translations, extend]);
  const catalogEntries = useMemo(() => Object.entries(data?.catalog ?? {}), [data?.catalog]);
  const selectedCapabilities = useMemo(() => Object.values(selected), [selected]);
  const selectedIds = useMemo(() => selectedCapabilities.map((capability) => capability.id), [selectedCapabilities]);
  const selectedCount = selectedIds.length;
  const countsByCategory = useMemo(() => selectedCapabilities.reduce((acc, capability) => {
    const category = capability.category;
    acc[category] = (acc[category] ?? 0) + 1;
    return acc;
  }, {}), [selectedCapabilities]);
  const categoryEntries = Object.keys(CATEGORY_LABELS).map((category) => [category, countsByCategory[category] ?? 0]).filter(([, count]) => count > 0);
  const handleToggleCapability = (capability) => {
    setSelected((prev) => {
      const next = {
        ...prev
      };
      if (next[capability.id]) {
        delete next[capability.id];
      } else {
        next[capability.id] = capability;
      }
      return next;
    });
  };
  const handleCreateCharacter = () => {
    if (selectedCount === 0 || isCreating) {
      return;
    }
    createCharacter({
      capabilityIds: selectedIds,
      lang
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen container py-10 pb-32 space-y-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between flex-wrap gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground uppercase tracking-wide text-xs", children: t("app.title") }),
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold mt-1", children: "Capabilities" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3", children: /* @__PURE__ */ jsx(LangSwitcher, {}) })
    ] }),
    catalogEntries.map(([category, capabilities]) => /* @__PURE__ */ jsxs("section", { className: "space-y-4", children: [
      /* @__PURE__ */ jsx("header", { children: /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold tracking-wide text-muted-foreground uppercase", children: category }) }),
      /* @__PURE__ */ jsx(CapabilityList, { capabilities, selectedMap: selected, onToggle: handleToggleCapability, translate: t })
    ] }, category)),
    /* @__PURE__ */ jsx(SelectionBar, { selectionTitle: t("app.selection.title"), selectionEmptyText: t("app.selection.empty"), totalLabel: t("app.selection.total", "Total"), selectedCount, categoryEntries, categoryLabels: CATEGORY_LABELS, creating: isCreating, onCreate: handleCreateCharacter, actionLabel: t("app.actions.createCharacter", "Create character"), actionLoadingLabel: t("app.loader.creatingCharacter.title", "Summoning your character"), disabled: selectedCount === 0 || isCreating }),
    isCreating && /* @__PURE__ */ jsxs("div", { className: "fixed no-doc-scroll inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/10 backdrop-blur", children: [
      /* @__PURE__ */ jsx("div", { className: "h-16 w-16 rounded-full border-4 border-muted border-t-primary animate-spin" }),
      /* @__PURE__ */ jsxs("div", { className: "text-center space-y-1", children: [
        /* @__PURE__ */ jsx("p", { className: "text-base font-semibold", children: t("app.loader.creatingCharacter.title") }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: t("app.loader.creatingCharacter.subtitle") })
      ] })
    ] })
  ] });
}
const CATEGORY_LABELS = {
  [CapabilityCategory.Oscillator]: "Oscillator",
  [CapabilityCategory.Modulation]: "Modulation",
  [CapabilityCategory.Fx]: "FX",
  [CapabilityCategory.Control]: "Control",
  [CapabilityCategory.Sequencer]: "Sequencer"
};
export {
  App as component
};
