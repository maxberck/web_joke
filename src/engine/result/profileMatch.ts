import type { IdealProfile, MatchBaseline, Stats } from "@final-form/shared-types";

export function profileDistance(stats: Stats, ideal: IdealProfile): number {
  let sumSquares = 0;
  let count = 0;

  for (const [key, idealValue] of Object.entries(ideal)) {
    if (idealValue === undefined) continue;
    const actual = stats[key as keyof Stats];
    if (!Number.isFinite(actual) || !Number.isFinite(idealValue)) continue;
    const diff = actual - idealValue;
    sumSquares += diff * diff;
    count += 1;
  }

  if (count === 0) return Number.POSITIVE_INFINITY;
  return Math.sqrt(sumSquares / count);
}

export function findBestMatch<T extends { idealProfile: IdealProfile }>(stats: Stats, entries: T[]): T {
  if (entries.length === 0) throw new Error("findBestMatch: la liste d'entrées ne peut pas être vide");
  return entries.reduce((best, entry) =>
    profileDistance(stats, entry.idealProfile) < profileDistance(stats, best.idealProfile) ? entry : best,
  );
}

export function findBestMatchNormalized<T extends { id: string; idealProfile: IdealProfile }>(
  stats: Stats,
  entries: T[],
  baselines?: Record<string, MatchBaseline>,
): T {
  if (entries.length === 0) throw new Error("findBestMatchNormalized: la liste d'entrées ne peut pas être vide");
  const baselineSet = baselines;
  if (!baselineSet) return findBestMatch(stats, entries);

  function zScore(entry: T): number {
    const distance = profileDistance(stats, entry.idealProfile);
    if (!Number.isFinite(distance)) return Number.POSITIVE_INFINITY;

    const baseline = baselineSet[entry.id];
    if (!baseline) throw new Error(`Baseline manquante pour ${entry.id}`);
    if (!Number.isFinite(baseline.mean) || !Number.isFinite(baseline.std) || baseline.std <= 0) {
      throw new Error(`Baseline invalide pour ${entry.id}`);
    }

    const score = (distance - baseline.mean) / baseline.std;
    if (!Number.isFinite(score)) throw new Error(`Score normalisé invalide pour ${entry.id}`);
    return score;
  }

  return entries.reduce((best, entry) => (zScore(entry) < zScore(best) ? entry : best));
}
