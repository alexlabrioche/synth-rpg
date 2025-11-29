import { z } from "zod";

export enum CapabilityCategory {
  Oscillator = "oscillator",
  Modulation = "modulation",
  Fx = "fx",
  Control = "control",
  Sequencer = "sequencer",
}

export const capabilitySchema = z.object({
  id: z.string(),
  slug: z.string(),
  category: z.nativeEnum(CapabilityCategory),
  label: z.string(),
  description: z.string(),
});

export type Capability = z.infer<typeof capabilitySchema>;

export type CapabilityId = Capability["id"];
