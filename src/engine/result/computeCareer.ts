import type { Stats, Career, MatchBaselineSet } from "@final-form/shared-types";
import { findBestMatchNormalized } from "./profileMatch.ts";

export function computeCareer(stats: Stats, careers: Career[], baselines?: MatchBaselineSet): Career {
  return findBestMatchNormalized(stats, careers, baselines);
}
