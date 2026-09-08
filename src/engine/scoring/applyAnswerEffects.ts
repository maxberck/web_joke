import type { Stats, StatEffects } from "@final-form/shared-types";
import { clampStats } from "./clampStats.ts";

/**
 * Applique un ou plusieurs ensembles d'effets sans dépendre de leur ordre.
 * Les effets d'une session sont additionnés avant l'unique clamp final.
 */
export function applyAnswerEffects(current: Stats, effects: StatEffects | StatEffects[]): Stats {
  const effectList = Array.isArray(effects) ? effects : [effects];
  const next: Stats = { ...current };

  for (const effectSet of effectList) {
    for (const [key, delta] of Object.entries(effectSet)) {
      if (delta === undefined) continue;
      if (!Number.isFinite(delta)) {
        throw new Error(`Invalid effect for stat "${key}": expected a finite number.`);
      }

      const statKey = key as keyof Stats;
      if (!(statKey in next)) {
        throw new Error(`Unknown stat effect key: "${key}".`);
      }

      next[statKey] += delta;
    }
  }

  return clampStats(next);
}
