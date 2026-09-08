export interface RarityBucket {
  /** Score de rareté minimum pour tomber dans ce bucket (bornes croissantes). */
  minScore: number;
  oneInX: number;
}

/**
 * Table de correspondance score → "1/X", générée par `simulation/buildRarityDistribution.ts`
 * à partir de centaines de milliers de profils simulés (percentiles réels, pas inventés).
 * Tant que la simulation n'a pas tourné, on utilise une table de secours grossière
 * pour ne pas bloquer le développement — à REMPLACER par la vraie distribution.
 */
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
}

export function computeRarity(
  totalRarityScore: number,
  options: ComputeRarityOptions = {}
): { score: number; oneInX: number } {
  const table = options.table ?? FALLBACK_RARITY_TABLE;

  // On cherche le dernier bucket dont le seuil est <= au score du profil.
  let oneInX = table[0]!.oneInX;
  for (const bucket of table) {
    if (totalRarityScore >= bucket.minScore) {
      oneInX = bucket.oneInX;
    }
  }

  return { score: totalRarityScore, oneInX };
}
