import type { Stats, IdealProfile, MatchBaseline } from "@final-form/shared-types";

/**
 * Score de compatibilité entre le profil utilisateur et un profil idéal.
 * Plus le score est BAS, plus le profil est proche (distance euclidienne pondérée).
 * Utilisé pour Career, Animal, Class, Power (sections 9, 10, 11, 14).
 */
export function profileDistance(stats: Stats, ideal: IdealProfile): number {
  let sumSquares = 0;
  let count = 0;

  for (const [key, idealValue] of Object.entries(ideal)) {
    if (idealValue === undefined) continue;
    const diff = stats[key as keyof Stats] - idealValue;
    sumSquares += diff * diff;
    count += 1;
  }

  if (count === 0) return Infinity;
  return Math.sqrt(sumSquares / count);
}

/**
 * Trouve l'entrée dont le profil idéal est le plus proche des stats utilisateur.
 * Distance brute : utile seulement en l'absence de baseline (voir findBestMatchNormalized).
 */
export function findBestMatch<T extends { idealProfile: IdealProfile }>(
  stats: Stats,
  entries: T[]
): T {
  if (entries.length === 0) {
    throw new Error("findBestMatch: la liste d'entrées ne peut pas être vide");
  }

  return entries.reduce((best, entry) =>
    profileDistance(stats, entry.idealProfile) < profileDistance(stats, best.idealProfile)
      ? entry
      : best
  );
}

/**
 * Matching normalisé par score-z : compare la distance au profil idéal non pas en
 * valeur absolue, mais relativement à la distance MOYENNE que produit ce profil idéal
 * sur une population réelle de joueurs (calculée par simulation, voir
 * simulation/buildMatchBaselines.ts).
 *
 * Pourquoi c'est nécessaire : un métier qui exige 5 stats simultanément très hautes
 * (ex. Docteur) a une distance brute presque toujours grande, même pour un excellent
 * candidat — alors qu'un métier au profil idéal proche de la neutralité (ex. Mechanic)
 * aura une distance brute petite pour n'importe quel profil moyen. Sans normalisation,
 * le second gagne systématiquement, indépendamment de la pertinence réelle du match.
 * Le score-z corrige ça : on choisit l'entrée pour laquelle CE profil est le plus
 * exceptionnellement proche, relativement à la difficulté propre de cette entrée.
 */
export function findBestMatchNormalized<T extends { id: string; idealProfile: IdealProfile }>(
  stats: Stats,
  entries: T[],
  baselines: Record<string, MatchBaseline> | undefined
): T {
  if (entries.length === 0) {
    throw new Error("findBestMatchNormalized: la liste d'entrées ne peut pas être vide");
  }

  // Pas de baseline disponible (avant la première simulation) : on retombe sur la distance brute.
  if (!baselines) return findBestMatch(stats, entries);
  const resolvedBaselines = baselines;

  function zScore(entry: T): number {
    const distance = profileDistance(stats, entry.idealProfile);
    const baseline = resolvedBaselines[entry.id];
    if (!baseline) return distance; // entrée absente des baselines (contenu ajouté depuis) : fallback brut
    return (distance - baseline.mean) / baseline.std;
  }

  return entries.reduce((best, entry) => (zScore(entry) < zScore(best) ? entry : best));
}
