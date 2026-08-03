/** Percentile-driven colour ramp: clay below average, neutral at average, green above. */
export function ramp(p: number | null | undefined): string {
  if (p == null) return "var(--dimmer)";
  if (p < 50) {
    const mix = Math.min(100, (50 - p) * 1.7);
    return `color-mix(in oklab, var(--clay) ${mix}%, var(--dim))`;
  }
  const mix = Math.min(100, (p - 50) * 1.85);
  return `color-mix(in oklab, var(--green) ${mix}%, var(--dim))`;
}
