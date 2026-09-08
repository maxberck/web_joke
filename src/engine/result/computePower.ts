import type { Stats, PowerEntry, MatchBaselineSet } from "@final-form/shared-types";
import { findBestMatchNormalized } from "./profileMatch.ts";

export function computePower(stats: Stats, powers: PowerEntry[], baselines?: MatchBaselineSet): PowerEntry {
  return findBestMatchNormalized(stats, powers, baselines);
}
