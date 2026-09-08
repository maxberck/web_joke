import type { Stats } from "@final-form/shared-types";
import { weightedMix } from "./weightedMix.ts";

export function computeDrive(stats: Stats): number {
  return weightedMix(stats, {
    ambition: 1,
    energy: 0.8,
    discipline: 0.7,
    risk: 0.5,
  });
}
