import type { CapabilityCategory } from "@synth-rpg/types";
import { FixedActionBar } from "@/components/fixed-action-bar";

interface SelectionBarProps {
  selectionTitle: string;
  selectionEmptyText: string;
  totalLabel: string;
  selectedCount: number;
  categoryEntries: (readonly [CapabilityCategory, number])[];
  categoryLabels: Record<CapabilityCategory, string>;
  creating: boolean;
  onCreate: () => void;
  actionLabel: string;
  actionLoadingLabel: string;
  disabled: boolean;
}

export function SelectionBar({
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
  disabled,
}: SelectionBarProps) {
  const details =
    selectedCount > 0 ? (
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">
          {totalLabel}: {selectedCount}
        </span>
        {categoryEntries.map(([category, count]) => (
          <span key={category}>
            {categoryLabels[category]}: {count}
          </span>
        ))}
      </div>
    ) : undefined;

  return (
    <FixedActionBar
      title={selectionTitle}
      description={selectedCount > 0 ? undefined : selectionEmptyText}
      details={details}
      actionLabel={actionLabel}
      actionLoadingLabel={actionLoadingLabel}
      onAction={onCreate}
      disabled={disabled}
      loading={creating}
    />
  );
}
