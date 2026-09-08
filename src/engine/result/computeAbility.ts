import type { Stats, AbilityEntry, MatchBaselineSet } from "@final-form/shared-types";
import { findBestMatchNormalized } from "./profileMatch.ts";

export function computeAbility(stats: Stats, abilities: AbilityEntry[], baselines?: MatchBaselineSet): AbilityEntry {
  return findBestMatchNormalized(stats, abilities, baselines);
}
