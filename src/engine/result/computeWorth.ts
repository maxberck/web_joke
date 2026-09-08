import type { Stats, Career, DerivedStats } from "@final-form/shared-types";

export interface ComputeWorthOptions {
  rng?: () => number;
}

/**
 * Worth fictif et humoristique (jamais une vraie estimation financière, section 19).
 * Combine le potentiel de la Career, la Financial Ability dérivée, et une part de
 * hasard contrôlée pour permettre des profils endettés, normaux, ou (très rarement)
 * extraordinaires — cf. objectif de variance de la section 19 et 27.
 */
export function computeWorth(
  stats: Stats,
  derived: DerivedStats,
  career: Career,
  options: ComputeWorthOptions = {}
): number {
  const { rng = Math.random } = options;

  const { min, max } = career.worthPotential;
  const financialFactor = derived.financialAbility / 100; // 0..1
  const luckFactor = stats.luck / 100; // 0..1

  // Position de base dans la fourchette de la carrière, pondérée par la compétence financière.
  const base = min + (max - min) * financialFactor;

  // Bruit contrôlé : peut faire tomber sous zéro (dette) ou dépasser légèrement la fourchette.
  const noise = (rng() * 2 - 1) * (max - min) * 0.15;
  let worth = base + noise;

  // Événement rare : jackpot entrepreneurial si luck + risk + ambition + intelligence sont
  // TOUS très élevés en même temps. Probabilité volontairement infime (voir simulation/).
  const jackpotEligible =
    stats.luck > 90 && stats.risk > 80 && stats.ambition > 90 && stats.intelligence > 85;

  if (jackpotEligible && rng() < 0.02) {
    worth *= 50 + luckFactor * 100; // peut propulser vers les millions/milliards
  }

  // Risque de dette : faible discipline + faible financial sense augmente la probabilité
  // d'un Worth négatif indépendamment de la carrière.
  const debtRisk = (100 - stats.discipline) / 100 * (100 - stats.financialSense) / 100;
  if (rng() < debtRisk * 0.3) {
    worth = -Math.abs(worth) * (0.1 + rng() * 0.4);
  }

  return Math.round(worth);
}
