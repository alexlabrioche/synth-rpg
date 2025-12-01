import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface FixedActionBarProps {
  title: string;
  description?: string;
  details?: ReactNode;
  actionLabel: string;
  actionLoadingLabel?: string;
  onAction: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function FixedActionBar({
  title,
  description,
  details,
  actionLabel,
  actionLoadingLabel,
  onAction,
  disabled,
  loading,
}: FixedActionBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur shadow-2xl">
      <div className="container mx-auto py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
          {details}
        </div>
        <Button size="lg" onClick={onAction} disabled={disabled}>
          {loading && actionLoadingLabel ? actionLoadingLabel : actionLabel}
        </Button>
      </div>
    </div>
  );
}
