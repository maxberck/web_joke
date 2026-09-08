import type { Stats } from "@final-form/shared-types";
import { weightedMix } from "./weightedMix.ts";

export function computeCompetence(stats: Stats): number {
  return weightedMix(stats, {
    intelligence: 1,
    discipline: 1,
    creativity: 0.8,
    professionalism: 1,
    communication: 0.6,
  });
}
