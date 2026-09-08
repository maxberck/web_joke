export interface RarityBucket {
  minScore: number;
  oneInX: number;
}

export const FALLBACK_RARITY_TABLE: RarityBucket[] = [
  { minScore: 0, oneInX: 2 },
  { minScore: 5, oneInX: 10 },
  { minScore: 10, oneInX: 50 },
  { minScore: 15, oneInX: 500 },
  { minScore: 20, oneInX: 5000 },
  { minScore: 25, oneInX: 100000 },
  { minScore: 30, oneInX: 1000000 },
];

export interface ComputeRarityOptions {
  table?: RarityBucket[];
  allowFallback?: boolean;
}

export function computeRarity(
  totalRarityScore: number,
  options: ComputeRarityOptions = {},
): { score: number; oneInX: number } {
  const table = options.table ?? (options.allowFallback ? FALLBACK_RARITY_TABLE : undefined);
  if (!table || table.length === 0) {
    throw new Error("Rarity table is required for production result calculation");
  }

  const sorted = [...table].sort((a, b) => a.minScore - b.minScore);
  let oneInX = sorted[0]!.oneInX;
  for (const bucket of sorted) {
    if (totalRarityScore >= bucket.minScore) oneInX = bucket.oneInX;
  }

  return { score: Number.isFinite(totalRarityScore) ? totalRarityScore : 0, oneInX };
}
