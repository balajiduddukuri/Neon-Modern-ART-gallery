
export interface ArtConfig {
  subject: string;
  feature: string;
  color: string;
  count: string;
  backgroundTexture: string;
}

export interface ArtPiece {
  id: string;
  url: string;
  config: ArtConfig;
  prompt: string;
  timestamp: number;
}

export enum GeneratorState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  ERROR = 'ERROR',
}

export type ViewMode = 'single' | 'infinite';

export const NEON_COLORS = [
  "neon yellow",
  "neon cyan",
  "electric magenta",
  "bright lime green",
  "vibrant orange",
  "electric blue",
  "hot pink",
  "glowing violet",
  "cyan",
  "magenta"
];

export interface SubjectTheme {
  name: string;
  feature: string;
}

export const SUBJECTS: SubjectTheme[] = [
  { name: "front-facing cats", feature: "ears and collar tags" },
  { name: "perched birds", feature: "wing tips and eye rings" },
  { name: "slender trees", feature: "select leaves and thin branches" },
  { name: "standing human silhouettes", feature: "subtle cheekbones and wrist bracelets" },
  { name: "school of fish", feature: "fin edges and eye spots" },
  { name: "howling wolves", feature: "eyes and fur tips" },
  { name: "watching owls", feature: "large eyes and talons" },
  { name: "floating jellyfish", feature: "trailing tentacles and bells" },
  { name: "abstract statues", feature: "sharp geometric edges" },
  { name: "dancing figures", feature: "flowing dress hems and shoes" },
  { name: "grazing deer", feature: "antler tips and nose" },
  { name: "resting butterflies", feature: "wing patterns and antennae" },
  { name: "blooming flowers", feature: "petal edges and stamens" },
  { name: "modern vases", feature: "rims and curves" },
  { name: "minimalist chairs", feature: "legs and backrest edges" }
];

export const COUNTS = ["single large", "pair of", "group of 3", "cluster of 4", "collection of"];

export const BACKGROUND_TEXTURES = [
  "wisps of fog",
  "subtle watercolor bleed",
  "fine dust particles suspended in light",
  "faint graphite smudges",
  "soft, diffused cloud shadows",
  "delicate washes of pale gray",
  "minimalist canvas grain",
  "ethereal mist layers"
];
