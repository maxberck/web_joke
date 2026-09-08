import type { StatKey } from "./stats.ts";

export type ComparisonOp = ">" | ">=" | "<" | "<=" | "==";

export interface StatCondition {
  stat: StatKey;
  op: ComparisonOp;
  value: number;
}

export interface SynergyRule {
  id: string;
  conditions: StatCondition[];
  /**
   * Poids de la règle. Sert à trancher les conflits (plus de conditions /
   * conditions plus strictes = règle plus spécifique = poids plus élevé)
   * et alimente le score de rareté cumulatif.
   */
  weight: number;
  /** Contribution au score de rareté total du profil (voir simulation/). */
  rarityScore: number;
  /** Tags produits si la règle matche, consommés par les moteurs Class/Power/etc. */
  tags: string[];
}

export interface MatchedRule extends SynergyRule {
  matched: true;
}
