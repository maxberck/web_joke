import type { Stats } from "@final-form/shared-types";
import { profileDistance } from "./profileMatch.ts";

type WeaknessEntry = { id: string; lowProfile: Partial<Stats> } & Record<string, unknown>;
type MatchBaselineSet = Record<string, { mean: number; std: number }>;

export function computeWeakness(
  stats: Stats,
  weaknesses: WeaknessEntry[],
  baselines?: MatchBaselineSet,
): WeaknessEntry {
  if (weaknesses.length === 0) {
    throw new Error("computeWeakness: la liste de weaknesses ne peut pas être vide");
  }

  function zScore(entry: WeaknessEntry): number {
    const distance = profileDistance(stats, entry.lowProfile);
    if (!Number.isFinite(distance)) return Number.POSITIVE_INFINITY;
    const baseline = baselines?.[entry.id];
    if (!baseline || !Number.isFinite(baseline.mean) || !Number.isFinite(baseline.std) || baseline.std <= 0) {
      return distance;
    }
    return (distance - baseline.mean) / baseline.std;
  }

  return weaknesses.reduce((best, entry) => (zScore(entry) < zScore(best) ? entry : best));
}
