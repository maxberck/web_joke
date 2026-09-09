export interface HybridRarityInput {
  probabilities: number[];
  synergyScore: number;
  extremityScore: number;
}

export interface HybridRarityResult {
  score: number;
  oneInX: number;
  appearanceOneInX: number;
  synergyScore: number;
  extremityScore: number;
  behavioralMultiplier: number;
}

const MIN_ONE_IN_X = 25;
const MAX_ONE_IN_X = 1_000_000_000;
const EFFECTIVE_COMBINATION_EXPONENT = 2.65;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundReadable(value: number): number {
  if (value < 100) return Math.max(1, Math.round(value));
  const magnitude = 10 ** Math.max(0, Math.floor(Math.log10(value)) - 1);
  return Math.round(value / magnitude) * magnitude;
}

/**
 * Combine la fréquence estimée des composants du profil avec sa rareté
 * comportementale. L'exposant effectif reflète le fait que les huit sorties
 * sont corrélées par les mêmes stats : on évite donc le produit naïf des
 * probabilités, qui produirait des nombres artificiellement astronomiques.
 */
export function computeHybridRarity(input: HybridRarityInput): HybridRarityResult {
  if (!Array.isArray(input.probabilities) || input.probabilities.length === 0) {
    throw new Error("Hybrid rarity: probabilities are required");
  }

  const probabilities = input.probabilities.map((probability) => {
    if (!Number.isFinite(probability) || probability <= 0) {
      throw new Error("Hybrid rarity: probabilities must be finite and > 0");
    }
    return clamp(probability, Number.EPSILON, 1);
  });

  const logMean = probabilities.reduce((sum, probability) => sum + Math.log(probability), 0) / probabilities.length;
  const geometricMean = Math.exp(logMean);
  const baseOneInX = 1 / geometricMean;
  const appearanceOneInX = clamp(baseOneInX ** EFFECTIVE_COMBINATION_EXPONENT, MIN_ONE_IN_X, MAX_ONE_IN_X);

  const synergyScore = Number.isFinite(input.synergyScore) ? Math.max(0, input.synergyScore) : 0;
  const extremityScore = Number.isFinite(input.extremityScore) ? Math.max(0, input.extremityScore) : 0;

  // Les synergies pèsent plus lourd que l'extrémité seule, mais la croissance
  // reste progressive afin qu'un seul seuil franchi ne fasse pas exploser 1/X.
  const synergyMultiplier = 1 + Math.log1p(synergyScore) * 0.65;
  const extremityMultiplier = 1 + Math.log1p(extremityScore) * 0.35;
  const behavioralMultiplier = synergyMultiplier * extremityMultiplier;

  const rawOneInX = clamp(appearanceOneInX * behavioralMultiplier, MIN_ONE_IN_X, MAX_ONE_IN_X);
  const oneInX = clamp(roundReadable(rawOneInX), MIN_ONE_IN_X, MAX_ONE_IN_X);

  return {
    score: synergyScore + extremityScore,
    oneInX,
    appearanceOneInX: roundReadable(appearanceOneInX),
    synergyScore,
    extremityScore,
    behavioralMultiplier: Number(behavioralMultiplier.toFixed(3)),
  };
}
