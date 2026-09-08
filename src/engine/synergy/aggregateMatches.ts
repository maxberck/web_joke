import type { MatchedRule } from "@final-form/shared-types";

export interface SynergyOutcome {
  /** Tous les tags produits par les règles matchées, dédupliqués. */
  tags: string[];
  /** Somme des rarityScore des règles matchées : entrée du Rarity Engine. */
  totalRarityScore: number;
  /** La règle la plus spécifique (poids le plus élevé), utile pour trancher un conflit direct. */
  dominantRule: MatchedRule | undefined;
}

export function aggregateMatches(matchedRules: MatchedRule[]): SynergyOutcome {
  const tagSet = new Set<string>();
  let totalRarityScore = 0;

  for (const rule of matchedRules) {
    for (const tag of rule.tags) tagSet.add(tag);
    totalRarityScore += rule.rarityScore;
  }

  return {
    tags: [...tagSet],
    totalRarityScore,
    dominantRule: matchedRules[0],
  };
}
