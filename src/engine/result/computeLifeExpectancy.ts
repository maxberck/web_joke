import type { Stats } from "@final-form/shared-types";
import { weightedMix } from "../derivedStats/weightedMix.ts";

const BASE_YEARS = 78;
const SWING_YEARS = 12; // amplitude max autour de la base

/**
 * Valeur purement humoristique et simulée (jamais une vraie prédiction médicale,
 * voir section 18). Discipline/luck/emotionalControl tirent vers le haut,
 * chaos/risk tirent vers le bas.
 */
export function computeLifeExpectancy(stats: Stats): number {
  const percent = weightedMix(stats, {
    discipline: 1,
    luck: 0.8,
    emotionalControl: 0.7,
    energy: 0.3,
    risk: -0.8,
    chaos: -0.6,
  });

  // percent est dans 0-100, on le recentre sur -1..+1 autour de 50
  const centered = (percent - 50) / 50;
  const years = BASE_YEARS + centered * SWING_YEARS;

  return Math.round(years * 10) / 10;
}
