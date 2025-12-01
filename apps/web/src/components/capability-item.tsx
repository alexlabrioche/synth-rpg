import type { Capability } from "@synth-rpg/types";
import { CapabilityCategory } from "@synth-rpg/types";
import { cn } from "@/lib/utils";

interface CapabilityItemProps {
  capability: Capability;
  selected: boolean;
  onToggle: (capability: Capability) => void;
  translate: (key: string, fallback?: string) => string;
}

const CATEGORY_FOLDER_MAP: Record<CapabilityCategory, string | null> = {
  [CapabilityCategory.Oscillator]: "audio-sources",
  [CapabilityCategory.Modulation]: "cv-sources",
  [CapabilityCategory.Fx]: "audio-modifiers",
  [CapabilityCategory.Control]: "cv-modifiers",
  [CapabilityCategory.Sequencer]: null,
};

const FALLBACK_ICON = "/tanstack-circle-logo.png";

export function CapabilityItem({
  capability,
  selected,
  onToggle,
  translate,
}: CapabilityItemProps) {
  const iconFolder = CATEGORY_FOLDER_MAP[capability.category];
  const iconSrc = iconFolder
    ? `/assets/${iconFolder}/${capability.slug}.png`
    : FALLBACK_ICON;
  const label = translate(capability.label, capability.slug);

  return (
    <button
      type="button"
      onClick={() => onToggle(capability)}
      aria-pressed={selected}
      className={cn(
        "rounded-xl border bg-card p-2 text-left shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:shadow-xl w-full",
        selected
          ? "border-primary shadow-primary/30 ring-1 ring-primary/70"
          : "border-border hover:border-primary/50 hover:shadow-md"
      )}
    >
      <div className="flex items-start gap-2">
        <img
          src={iconSrc}
          alt={label}
          className="size-12 object-cover"
          loading="lazy"
        />
        <div>
          <h3 className="text-lg font-semibold">{label}</h3>
          <p className="text-sm text-muted-foreground mt-2">
            {translate(capability.description, "")}
          </p>
        </div>
      </div>
    </button>
  );
}
