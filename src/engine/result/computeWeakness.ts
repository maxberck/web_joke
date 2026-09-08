import type { Stats, WeaknessEntry, MatchBaselineSet } from "@final-form/shared-types";
import { profileDistance } from "./profileMatch.ts";

/**
 * Une weakness est choisie sur les stats les plus BASSES du profil (contrepoids du Power).
 * Matching normalisé par score-z (voir profileMatch.ts) : sans ça, une weakness dont le
 * lowProfile est proche de la neutralité gagnerait systématiquement, peu importe la
 * pertinence réelle.
 */
export function computeWeakness(
  stats: Stats,
  weaknesses: WeaknessEntry[],
  baselines?: MatchBaselineSet
): WeaknessEntry {
  if (weaknesses.length === 0) {
    throw new Error("computeWeakness: la liste de weaknesses ne peut pas être vide");
  }

  function zScore(entry: WeaknessEntry): number {
    const distance = profileDistance(stats, entry.lowProfile);
    const baseline = baselines?.[entry.id];
    if (!baseline) return distance;
    return (distance - baseline.mean) / baseline.std;
  }

  return weaknesses.reduce((best, entry) => (zScore(entry) < zScore(best) ? entry : best));
}
