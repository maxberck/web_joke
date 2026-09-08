import type { Stats, StatKey } from "@final-form/shared-types";

/**
 * Calcule une moyenne pondérée de plusieurs stats et ramène le résultat
 * dans 0-100 (les poids n'ont pas besoin de sommer à 1, ils sont normalisés ici).
 */
export function weightedMix(stats: Stats, weights: Partial<Record<StatKey, number>>): number {
  let weightedSum = 0;
  let totalAbsWeight = 0;

  for (const [key, weight] of Object.entries(weights)) {
    if (weight === undefined) continue;
    weightedSum += stats[key as StatKey] * weight;
    totalAbsWeight += Math.abs(weight);
  }

  if (totalAbsWeight === 0) return 0;
  // Normaliser par la somme des poids absolus : un poids négatif (ex: emotionalControl
  // qui tempère dangerProfile) tire le score vers le bas sans fausser l'échelle 0-100.
  return Math.round(weightedSum / totalAbsWeight);
}
