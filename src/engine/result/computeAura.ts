import type { Stats } from "@final-form/shared-types";
import { weightedMix } from "../derivedStats/weightedMix.ts";

export function computeAuraPercent(stats: Stats): number {
  return weightedMix(stats, {
    social: 1,
    communication: 1,
    humor: 0.8,
    emotionalControl: 0.6,
    energy: 0.6,
  });
}
