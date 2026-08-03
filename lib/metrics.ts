import { Player } from "./types";

/** Strip accents so "Ramirez" matches "Ramírez". */
export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * Percentile of x within values: the share of values strictly less than x.
 * Computed within a single season's players, never pooled across seasons.
 */
export function percentileIn(values: number[], x: number | null | undefined): number | null {
  if (x == null || values.length === 0) return null;
  const below = values.filter((v) => v < x).length;
  return (100 * below) / values.length;
}

/** Build a lookup of percentile functions for a set of numeric keys, scoped to one season's players. */
export function buildPercentiles<K extends string>(
  players: Player[],
  keys: readonly K[]
): Record<K, (x: number | null | undefined) => number | null> {
  const out = {} as Record<K, (x: number | null | undefined) => number | null>;
  for (const key of keys) {
    const values = players
      .map((p) => (p as unknown as Record<string, number | null>)[key])
      .filter((v): v is number => v != null)
      .sort((a, b) => a - b);
    out[key] = (x) => percentileIn(values, x ?? null);
  }
  return out;
}

/** Mean of a field across players, ignoring nulls. Used to center the depth diagram on league average. */
export function leagueMean(players: Player[], key: keyof Player): number {
  const values = players
    .map((p) => p[key])
    .filter((v): v is number => typeof v === "number");
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function fmtNum(v: number | null | undefined, digits: number): string {
  if (v == null) return "--";
  return v.toFixed(digits);
}

export function fmtSigned(v: number | null | undefined, digits: number): string {
  if (v == null) return "--";
  return (v >= 0 ? "+" : "") + v.toFixed(digits);
}

export function fmtPct(v: number | null | undefined): string {
  if (v == null) return "--";
  return (v * 100).toFixed(0) + "%";
}

export function fmtPercentile(p: number | null | undefined): string {
  if (p == null) return "--";
  return `${p.toFixed(0)}th percentile`;
}
