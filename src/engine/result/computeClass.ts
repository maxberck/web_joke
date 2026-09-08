import type { Stats, ClassProfile, MatchBaselineSet } from "@final-form/shared-types";
import { findBestMatchNormalized } from "./profileMatch.ts";

export function computeClass(stats: Stats, classes: ClassProfile[], baselines?: MatchBaselineSet): ClassProfile {
  return findBestMatchNormalized(stats, classes, baselines);
}
