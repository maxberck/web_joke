import type { Stats } from "@final-form/shared-types";

type IdealProfile = Partial<Stats>;
type MatchBaseline = { mean: number; std: number };

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
  baselines: Record<string, MatchBaseline> | undefined,
): T {
  if (entries.length === 0) throw new Error("findBestMatchNormalized: la liste d'entrées ne peut pas être vide");
  if (!baselines) return findBestMatch(stats, entries);
  const baselineSet = baselines as Record<string, MatchBaseline>;

  function zScore(entry: T): number {
    const distance = profileDistance(stats, entry.idealProfile);
    if (!Number.isFinite(distance)) return Number.POSITIVE_INFINITY;
    const baseline = baselineSet[entry.id];
    if (!baseline) throw new Error(`Baseline manquante pour ${entry.id}`);
    if (!Number.isFinite(baseline.mean) || !Number.isFinite(baseline.std) || baseline.std <= 0) {
      throw new Error(`Baseline invalide pour ${entry.id}`);
    }
    return (distance - baseline.mean) / baseline.std;
  }

  return entries.reduce((best, entry) => (zScore(entry) < zScore(best) ? entry : best));
}
