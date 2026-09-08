import type { Stats } from "@final-form/shared-types";
import { weightedMix } from "./weightedMix.ts";

export function computeReliability(stats: Stats): number {
  return weightedMix(stats, {
    discipline: 1,
    professionalism: 1,
    emotionalControl: 1,
  });
}
