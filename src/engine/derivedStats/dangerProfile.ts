import type { Stats } from "@final-form/shared-types";
import { weightedMix } from "./weightedMix.ts";

export function computeDangerProfile(stats: Stats): number {
  return weightedMix(stats, {
    chaos: 1,
    risk: 1,
    ambition: 0.6,
    intelligence: 0.6,
    emotionalControl: -0.3, // un fort contrôle émotionnel tempère le danger
  });
}
