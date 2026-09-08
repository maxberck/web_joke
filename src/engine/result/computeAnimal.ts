import type { Stats, AnimalProfile, MatchBaselineSet } from "@final-form/shared-types";
import { findBestMatchNormalized } from "./profileMatch.ts";

export function computeAnimal(stats: Stats, animals: AnimalProfile[], baselines?: MatchBaselineSet): AnimalProfile {
  return findBestMatchNormalized(stats, animals, baselines);
}
