import type { Capability } from "@synth-rpg/types";
import { CapabilityItem } from "./capability-item";

interface CapabilityListProps {
  capabilities: Capability[];
  selectedMap: Record<Capability["id"], Capability>;
  onToggle: (capability: Capability) => void;
  translate: (key: string, fallback?: string) => string;
}

export function CapabilityList({
  capabilities,
  selectedMap,
  onToggle,
  translate,
}: CapabilityListProps) {
  if (!capabilities?.length) {
    return null;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {capabilities.map((capability) => (
        <CapabilityItem
          key={capability.id}
          capability={capability}
          selected={Boolean(selectedMap[capability.id])}
          onToggle={onToggle}
          translate={translate}
        />
      ))}
    </div>
  );
}
