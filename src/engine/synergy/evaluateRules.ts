import type { Stats, SynergyRule, MatchedRule } from "@final-form/shared-types";
import { evaluateCondition } from "./evaluateCondition.ts";

/**
 * Retourne toutes les règles dont TOUTES les conditions sont satisfaites,
 * triées par poids décroissant (les plus spécifiques d'abord).
 */
export function evaluateRules(stats: Stats, rules: SynergyRule[]): MatchedRule[] {
  const matched = rules.filter((rule) =>
    rule.conditions.every((condition) => evaluateCondition(stats, condition))
  );

  return matched
    .map((rule) => ({ ...rule, matched: true as const }))
    .sort((a, b) => b.weight - a.weight);
}
