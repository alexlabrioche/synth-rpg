import { useEffect, useMemo, useState } from "react";
import { LangSwitcher } from "@/components/lang-switcher";
import {
  capabilitiesQueryOptions,
  useCapabilitiesQuery,
} from "@/hooks/useCapabilitiesQuery";
import { useCreateCharacterMutation } from "@/hooks/useCreateCharacter";
import { createFileRoute } from "@tanstack/react-router";
import { capabilityTranslationsToBatch, useI18n } from "@/i18n";
import type { Capability } from "@synth-rpg/types";
import { CapabilityCategory } from "@synth-rpg/types";
import { CapabilityList } from "@/components/capability-list";
import { SelectionBar } from "@/components/selection-bar";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(capabilitiesQueryOptions());
  },
  component: App,
});

type SelectedCapabilities = Record<Capability["id"], Capability>;

function App() {
  const { data } = useCapabilitiesQuery();
  const { lang, t, extend } = useI18n();
  const navigate = Route.useNavigate();
  const [selected, setSelected] = useState<SelectedCapabilities>({});
  const { mutate: createCharacter, isPending: isCreating } =
    useCreateCharacterMutation({
      onSuccess: (character) => {
        setSelected({});
        navigate({
          to: "/characters/$characterId",
          params: { characterId: character.id },
        });
      },
    });

  useEffect(() => {
    if (!data?.translations) {
      return;
    }

    extend(capabilityTranslationsToBatch(data.translations));
  }, [data?.translations, extend]);

  const catalogEntries = useMemo(
    () => Object.entries(data?.catalog ?? {}),
    [data?.catalog]
  );

  const selectedCapabilities = useMemo(
    () => Object.values(selected),
    [selected]
  );
  const selectedIds = useMemo(
    () => selectedCapabilities.map((capability) => capability.id),
    [selectedCapabilities]
  );
  const selectedCount = selectedIds.length;
  const countsByCategory = useMemo(
    () =>
      selectedCapabilities.reduce(
        (acc, capability) => {
          const category = capability.category;
          acc[category] = (acc[category] ?? 0) + 1;
          return acc;
        },
        {} as Partial<Record<CapabilityCategory, number>>
      ),
    [selectedCapabilities]
  );
  const categoryEntries = (Object.keys(CATEGORY_LABELS) as CapabilityCategory[])
    .map((category) => [category, countsByCategory[category] ?? 0] as const)
    .filter(([, count]) => count > 0);

  const handleToggleCapability = (capability: Capability) => {
    setSelected((prev) => {
      const next = { ...prev };
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
      lang,
    });
  };

  return (
    <div className="min-h-screen container py-10 pb-32 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-muted-foreground uppercase tracking-wide text-xs">
            {t("app.title")}
          </p>
          <h1 className="text-3xl font-bold mt-1">Capabilities</h1>
        </div>
        <div className="flex items-center gap-3">
          <LangSwitcher />
        </div>
      </div>

      {catalogEntries.map(([category, capabilities]) => (
        <section key={category} className="space-y-4">
          <header>
            <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              {category}
            </p>
          </header>
          <CapabilityList
            capabilities={capabilities}
            selectedMap={selected}
            onToggle={handleToggleCapability}
            translate={t}
          />
        </section>
      ))}

      <SelectionBar
        selectionTitle={t("app.selection.title")}
        selectionEmptyText={t("app.selection.empty")}
        totalLabel={t("app.selection.total", "Total")}
        selectedCount={selectedCount}
        categoryEntries={categoryEntries}
        categoryLabels={CATEGORY_LABELS}
        creating={isCreating}
        onCreate={handleCreateCharacter}
        actionLabel={t("app.actions.createCharacter", "Create character")}
        actionLoadingLabel={t(
          "app.loader.creatingCharacter.title",
          "Summoning your character"
        )}
        disabled={selectedCount === 0 || isCreating}
      />

      {isCreating && (
        <div className="fixed no-doc-scroll inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/10 backdrop-blur">
          <div className="h-16 w-16 rounded-full border-4 border-muted border-t-primary animate-spin" />
          <div className="text-center space-y-1">
            <p className="text-base font-semibold">
              {t("app.loader.creatingCharacter.title")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("app.loader.creatingCharacter.subtitle")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

const CATEGORY_LABELS: Record<CapabilityCategory, string> = {
  [CapabilityCategory.Oscillator]: "Oscillator",
  [CapabilityCategory.Modulation]: "Modulation",
  [CapabilityCategory.Fx]: "FX",
  [CapabilityCategory.Control]: "Control",
  [CapabilityCategory.Sequencer]: "Sequencer",
};
