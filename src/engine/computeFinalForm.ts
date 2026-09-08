import type { ContentPack, FinalForm, Stats, StatEffects, MatchBaselines } from "@final-form/shared-types";
import { createNeutralStats } from "@final-form/shared-types";
import { applyAnswerEffects } from "./scoring/index.ts";
import { computeDerivedStats } from "./derivedStats/index.ts";
import { evaluateRules, aggregateMatches, computeExtremityScore } from "./synergy/index.ts";
import {
  computeCareer,
  computeClass,
  computePower,
  computeWeakness,
  computeAbility,
  computeWorkStyle,
  computeAnimal,
  computeAlignment,
  computeAuraPercent,
  computeThreatLevel,
  computeLifeExpectancy,
  computeWorth,
  computeRarity,
  type RarityBucket,
} from "./result/index.ts";

export interface ComputeFinalFormOptions {
  /** Réponses choisies par l'utilisateur, dans l'ordre des questions posées. */
  chosenAnswerEffects: StatEffects[];
  content: ContentPack;
  rarityTable?: RarityBucket[];
  matchBaselines?: MatchBaselines;
  rng?: () => number;
}

/**
 * Pipeline unique : réponses → stats → dérivées → synergies → résultats.
 * Le scoring agrège toutes les réponses avant de borner les stats, ce qui rend
 * le résultat indépendant de l'ordre d'application des réponses.
 */
export function computeFinalForm(options: ComputeFinalFormOptions): FinalForm {
  const { chosenAnswerEffects, content, rarityTable, matchBaselines, rng = Math.random } = options;

  const coreStats: Stats = applyAnswerEffects(createNeutralStats(), chosenAnswerEffects);
  const derivedStats = computeDerivedStats(coreStats);

  const matchedRules = evaluateRules(coreStats, content.synergyRules);
  const synergyOutcome = aggregateMatches(matchedRules);
  const extremityScore = computeExtremityScore(coreStats);
  const totalRarityScore = Math.max(0, synergyOutcome.totalRarityScore + extremityScore);

  const career = computeCareer(coreStats, content.careers, matchBaselines?.careers);
  const classProfile = computeClass(coreStats, content.classes, matchBaselines?.classes);
  const power = computePower(coreStats, content.powers, matchBaselines?.powers);
  const weakness = computeWeakness(coreStats, content.weaknesses, matchBaselines?.weaknesses);
  const ability = computeAbility(coreStats, content.abilities, matchBaselines?.abilities);
  const workStyle = computeWorkStyle(coreStats, content.workStyles, matchBaselines?.workStyles);
  const animal = computeAnimal(coreStats, content.animals, matchBaselines?.animals);
  const alignment = computeAlignment(coreStats, content.alignments);
  const auraPercent = Math.max(0, Math.min(100, computeAuraPercent(coreStats)));
  const threatLevel = Math.max(0, Math.min(10, computeThreatLevel(coreStats)));
  const lifeExpectancyYears = Math.max(0, computeLifeExpectancy(coreStats));
  const worth = computeWorth(coreStats, derivedStats, career, { rng });
  const rarity = computeRarity(totalRarityScore, { table: rarityTable });

  return {
    coreStats,
    derivedStats,
    matchedRuleTags: synergyOutcome.tags,
    classId: classProfile.id,
    careerId: career.id,
    powerId: power.id,
    weaknessId: weakness.id,
    abilityId: ability.id,
    workStyleId: workStyle.id,
    animalId: animal.id,
    alignmentId: alignment.id,
    auraPercent,
    threatLevel,
    lifeExpectancyYears,
    worth,
    rarity: { score: rarity.score, oneInX: rarity.oneInX },
  };
}
