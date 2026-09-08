import { STAT_KEYS, STAT_RANGE, type Stats } from "@final-form/shared-types";

export function clampStats(stats: Stats): Stats {
  const clamped: Stats = { ...stats };
  for (const key of STAT_KEYS) {
    clamped[key] = Math.min(STAT_RANGE.max, Math.max(STAT_RANGE.min, clamped[key]));
  }
  return clamped;
}
