import type { Stats } from "@final-form/shared-types";
import { weightedMix } from "./weightedMix.ts";

export function computeFinancialAbility(stats: Stats): number {
  return weightedMix(stats, {
    financialSense: 1,
    discipline: 0.6,
    intelligence: 0.6,
    risk: 0.4,
    professionalism: 0.4,
  });
}
