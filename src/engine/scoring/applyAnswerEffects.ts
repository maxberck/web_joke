import type { Stats, StatEffects } from "@final-form/shared-types";
import { clampStats } from "./clampStats.ts";

/**
 * Applique les effets d'une réponse sur les stats courantes.
 * Ne modifie pas l'objet reçu : retourne un nouveau Stats.
 */
export function applyAnswerEffects(current: Stats, effects: StatEffects): Stats {
  const next: Stats = { ...current };

  for (const [key, delta] of Object.entries(effects)) {
    if (delta === undefined) continue;
    const statKey = key as keyof Stats;
    next[statKey] = next[statKey] + delta;
  }

  return clampStats(next);
}
