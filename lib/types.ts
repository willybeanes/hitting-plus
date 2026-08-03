export interface FieldMeta {
  key: string;
  label: string;
  desc: string;
}

export interface Player {
  player_name: string;
  game_year: number;
  pitches: number;
  swings: number;
  pa: number;
  "Hitting+": number | null;
  "Decision+": number | null;
  "Timing+": number | null;
  "Contact+": number | null;
  "Power+": number | null;
  "paBS+": number | null;
  "paAA+": number | null;
  xwoba: number | null;
  woba: number | null;
  extra_bases: number | null;
  swing_rate: number | null;
  whiff_rate: number | null;
  paBS: number | null;
  paAA: number | null;
  fooled: number | null;
  depth_FB: number | null;
  depth_BR: number | null;
  depth_OS: number | null;
}

export interface SwingPlusData {
  generated: string;
  source: string;
  seasons: number[];
  fields: FieldMeta[];
  players: Player[];
}

export const COMPONENT_KEYS = ["Decision+", "Timing+", "Contact+", "Power+"] as const;
export type ComponentKey = (typeof COMPONENT_KEYS)[number];

export const DEPTH_KEYS = ["depth_FB", "depth_BR", "depth_OS"] as const;
export type DepthKey = (typeof DEPTH_KEYS)[number];
