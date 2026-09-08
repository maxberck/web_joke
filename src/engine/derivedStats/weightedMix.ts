import type { Stats, StatKey } from "@final-form/shared-types";

/**
 * Weighted mix on a 0-100 scale.
 * Positive weights use the stat directly; negative weights explicitly mean
 * "the inverse of this stat" instead of allowing the weighted sum to leave the range.
 */
export function weightedMix(stats: Stats, weights: Partial<Record<StatKey, number>>): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [key, weight] of Object.entries(weights)) {
    if (weight === undefined || !Number.isFinite(weight)) continue;
    const magnitude = Math.abs(weight);
    const stat = Number.isFinite(stats[key as StatKey]) ? stats[key as StatKey] : 50;
    weightedSum += (weight >= 0 ? stat : 100 - stat) * magnitude;
    totalWeight += magnitude;
  }

  if (totalWeight === 0) return 0;
  return Math.min(100, Math.max(0, Math.round(weightedSum / totalWeight)));
}
