import type { Stats, Career, DerivedStats } from "@final-form/shared-types";

export interface ComputeWorthOptions { rng?: () => number; }

export function computeWorth(
  stats: Stats,
  derived: DerivedStats,
  career: Career,
  options: ComputeWorthOptions = {}
): number {
  const { rng = Math.random } = options;
  const { min, max } = career.worthPotential;
  const financialAbility = derived.financialAbility ?? 50;
  const financialFactor = financialAbility / 100;
  const luckFactor = stats.luck / 100;

  const base = min + (max - min) * financialFactor;
  const noise = (rng() * 2 - 1) * (max - min) * 0.15;
  let worth = base + noise;

  const jackpotEligible = stats.luck > 90 && stats.risk > 80 && stats.ambition > 90 && stats.intelligence > 85;
  if (jackpotEligible && rng() < 0.02) worth *= 50 + luckFactor * 100;

  const debtRisk = (100 - stats.discipline) / 100 * (100 - stats.financialSense) / 100;
  if (rng() < debtRisk * 0.3) worth = -Math.abs(worth) * (0.1 + rng() * 0.4);

  return Math.round(worth);
}
