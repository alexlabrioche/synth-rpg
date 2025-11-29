export type CapabilityIconId = string;

export interface CapabilityIcon {
  id: CapabilityIconId;
  group: "OSCILLATOR" | "MODULATION" | "FX" | "CONTROL" | "SEQUENCER" | "OTHER";
  label: string;
  description: string;
}
