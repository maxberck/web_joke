import type { Stats } from "@final-form/shared-types";
import { weightedMix } from "../derivedStats/weightedMix.ts";

/** Retourne un score 0-10 : "à quel point cette personne devient problématique avec une idée". */
export function computeThreatLevel(stats: Stats): number {
  const percent = weightedMix(stats, {
    chaos: 1,
    risk: 1,
    intelligence: 0.8,
    ambition: 0.6,
    energy: 0.4,
    emotionalControl: -0.3,
  });

  return Math.round((percent / 100) * 10 * 10) / 10; // arrondi à 1 décimale
}
