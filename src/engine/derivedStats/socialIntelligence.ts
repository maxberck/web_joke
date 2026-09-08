import type { Stats } from "@final-form/shared-types";
import { weightedMix } from "./weightedMix.ts";

export function computeSocialIntelligence(stats: Stats): number {
  return weightedMix(stats, {
    social: 1,
    communication: 1,
    empathy: 1,
    emotionalControl: 0.7,
  });
}
