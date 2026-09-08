import type { Stats, StatKey } from "@final-form/shared-types";

/**
 * Calcule une moyenne pondérée bornée sur 0..100.
 *
 * Les poids peuvent être négatifs pour représenter un effet de compensation,
 * mais la valeur publique reste toujours dans le contrat 0..100.
 */
export function weightedMix(stats: Stats, weights: Partial<Record<StatKey, number>>): number {
  let weightedSum = 0;
  let totalAbsWeight = 0;

  for (const [key, weight] of Object.entries(weights)) {
    if (weight === undefined) continue;
    if (!Number.isFinite(weight)) {
      throw new Error(`Invalid weight for stat "${key}": expected a finite number.`);
    }

    const value = stats[key as StatKey];
    if (!Number.isFinite(value)) {
      throw new Error(`Invalid stat "${key}": expected a finite number.`);
    }

    weightedSum += value * weight;
    totalAbsWeight += Math.abs(weight);
  }

  if (totalAbsWeight === 0) return 0;

  const value = weightedSum / totalAbsWeight;
  return Math.max(0, Math.min(100, Math.round(value)));
}
