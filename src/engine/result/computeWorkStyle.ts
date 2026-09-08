import type { Stats, WorkStyleEntry, MatchBaselineSet } from "@final-form/shared-types";
import { findBestMatchNormalized } from "./profileMatch.ts";

export function computeWorkStyle(
  stats: Stats,
  workStyles: WorkStyleEntry[],
  baselines?: MatchBaselineSet
): WorkStyleEntry {
  return findBestMatchNormalized(stats, workStyles, baselines);
}
