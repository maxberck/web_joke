import type { Stats } from "@final-form/shared-types";
import { weightedMix } from "./weightedMix.ts";

export function computeImprovisation(stats: Stats): number {
  return weightedMix(stats, {
    creativity: 1,
    chaos: 0.8,
    humor: 0.6,
    intelligence: 0.5,
  });
}
