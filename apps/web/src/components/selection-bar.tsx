import { Button } from "@/components/ui/button";
import type { CapabilityCategory } from "@synth-rpg/types";

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
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur shadow-2xl">
      <div className="container py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {selectionTitle}
          </p>
          {selectedCount > 0 ? (
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
          ) : (
            <p className="text-xs text-muted-foreground">
              {selectionEmptyText}
            </p>
          )}
        </div>
        <Button size="lg" onClick={onCreate} disabled={disabled}>
          {creating ? actionLoadingLabel : actionLabel}
        </Button>
      </div>
    </div>
  );
}
