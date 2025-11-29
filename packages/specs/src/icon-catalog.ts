import type { CapabilityIcon } from "@synth-rpg/types";

export const CAPABILITY_ICONS: CapabilityIcon[] = [
  {
    id: "OSC_ANALOG",
    group: "OSCILLATOR",
    label: "Analog oscillator",
    description: "Produces pitched tones using classic analog waveforms.",
  },
  {
    id: "OSC_WAVETABLE",
    group: "OSCILLATOR",
    label: "Wavetable oscillator",
    description: "Plays through tables of waveforms for evolving tones.",
  },
  {
    id: "LFO",
    group: "MODULATION",
    label: "LFO",
    description: "Slow modulation source that shapes parameters over time.",
  },
  {
    id: "ENVELOPE_LOOPING",
    group: "MODULATION",
    label: "Looping envelope",
    description:
      "Envelope generator able to loop, acting like a function generator.",
  },
  {
    id: "RANDOM_SOURCE",
    group: "MODULATION",
    label: "Random source",
    description: "Unpredictable modulation for controlled or wild variations.",
  },
  {
    id: "GRANULAR_ENGINE",
    group: "FX",
    label: "Granular engine",
    description: "Slices and reorders tiny grains of audio for textures.",
  },
  {
    id: "DELAY",
    group: "FX",
    label: "Delay",
    description: "Echoes sounds in time, can be rhythmic or smeared.",
  },
  {
    id: "SEQUENCER",
    group: "SEQUENCER",
    label: "Sequencer",
    description: "Steps through patterns of notes or modulation over time.",
  },
  // extend later…
];
