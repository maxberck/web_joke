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
  /**
   * Baselines de matching normalisé (moyenne/écart-type de distance par entrée),
   * générées par simulation/buildMatchBaselines.ts. Sans elles, le moteur retombe
   * sur un matching par distance brute (biaisé envers les profils "faciles" — voir
   * profileMatch.ts pour le détail du problème que ça corrige).
   */
  matchBaselines?: MatchBaselines;
  rng?: () => number;
}

/**
 * Fait tourner toute la chaîne décrite section 21 :
 * réponses -> stats -> dérivées -> synergies -> Career/Class/Power/... -> Final Form.
 * C'est la SEULE fonction que l'UI (ou le simulateur) a besoin d'appeler.
 */
export function computeFinalForm(options: ComputeFinalFormOptions): FinalForm {
  const { chosenAnswerEffects, content, rarityTable, matchBaselines, rng = Math.random } = options;

  // 1. Stats de base : on part du neutre et on applique chaque effet dans l'ordre.
  const coreStats = chosenAnswerEffects.reduce<Stats>(
    (stats, effects) => applyAnswerEffects(stats, effects),
    createNeutralStats()
  );

  // 2. Stats dérivées.
  const derivedStats = computeDerivedStats(coreStats);

  // 3. Synergies + score de rareté continu (voir computeExtremityScore.ts : corrige
  //    la stagnation du score de rareté sur un seul palier).
  const matchedRules = evaluateRules(coreStats, content.synergyRules);
  const synergyOutcome = aggregateMatches(matchedRules);
  const extremityScore = computeExtremityScore(coreStats);
  const totalRarityScore = synergyOutcome.totalRarityScore + extremityScore;

  // 4. Résultats individuels, tous dérivés du même profil + des synergies.
  //    Matching normalisé par score-z quand des baselines sont fournies (voir plus haut).
  const career = computeCareer(coreStats, content.careers, matchBaselines?.careers);
  const classProfile = computeClass(coreStats, content.classes, matchBaselines?.classes);
  const power = computePower(coreStats, content.powers, matchBaselines?.powers);
  const weakness = computeWeakness(coreStats, content.weaknesses, matchBaselines?.weaknesses);
  const ability = computeAbility(coreStats, content.abilities, matchBaselines?.abilities);
  const workStyle = computeWorkStyle(coreStats, content.workStyles, matchBaselines?.workStyles);
  const animal = computeAnimal(coreStats, content.animals, matchBaselines?.animals);
  const alignment = computeAlignment(coreStats, content.alignments);
  const auraPercent = computeAuraPercent(coreStats);
  const threatLevel = computeThreatLevel(coreStats);
  const lifeExpectancyYears = computeLifeExpectancy(coreStats);
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
