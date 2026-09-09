import type { AppearanceCalibration, ContentPack, FinalForm, Stats, StatEffects, MatchBaselines } from "@final-form/shared-types";
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
  computeHybridRarity,
  type RarityBucket,
} from "./result/index.ts";

export interface ComputeFinalFormOptions {
  chosenAnswerEffects: StatEffects[];
  content: ContentPack;
  matchBaselines: MatchBaselines;
  appearanceCalibration: AppearanceCalibration;
  /** @deprecated conservé temporairement pour compatibilité avec les anciens appels. */
  rarityTable?: RarityBucket[];
  rng?: () => number;
}

function assertFiniteResult(name: string, value: number): void {
  if (!Number.isFinite(value)) throw new Error(`FinalForm: ${name} doit être fini`);
}

function assertPercent(name: string, value: number): void {
  assertFiniteResult(name, value);
  if (value < 0 || value > 100) throw new Error(`FinalForm: ${name} doit rester dans 0..100`);
}

function calibratedProbability(group: Record<string, number>, id: string, label: string): number {
  const probability = group[id] ?? Number.NaN;
  if (!Number.isFinite(probability) || probability <= 0 || probability > 1) {
    throw new Error(`FinalForm: calibration d'apparition invalide pour ${label}.${id}`);
  }
  return probability;
}

/** Fait tourner toute la chaîne réponses -> stats -> résultats du quiz. */
export function computeFinalForm(options: ComputeFinalFormOptions): FinalForm {
  const { chosenAnswerEffects, content, matchBaselines, appearanceCalibration, rng = Math.random } = options;

  const coreStats = chosenAnswerEffects.reduce<Stats>(
    (stats, effects) => applyAnswerEffects(stats, effects),
    createNeutralStats(),
  );
  for (const [key, value] of Object.entries(coreStats)) assertPercent(key, value);

  const derivedStats = computeDerivedStats(coreStats);
  for (const [key, value] of Object.entries(derivedStats)) assertPercent(`derived.${key}`, value);

  const matchedRules = evaluateRules(coreStats, content.synergyRules);
  const synergyOutcome = aggregateMatches(matchedRules);
  const extremityScore = computeExtremityScore(coreStats);
  const totalRarityScore = synergyOutcome.totalRarityScore + extremityScore;
  assertFiniteResult("totalRarityScore", totalRarityScore);

  const career = computeCareer(coreStats, content.careers, matchBaselines.careers);
  const classProfile = computeClass(coreStats, content.classes, matchBaselines.classes);
  const power = computePower(coreStats, content.powers, matchBaselines.powers);
  const weakness = computeWeakness(coreStats, content.weaknesses, matchBaselines.weaknesses);
  const ability = computeAbility(coreStats, content.abilities, matchBaselines.abilities);
  const workStyle = computeWorkStyle(coreStats, content.workStyles, matchBaselines.workStyles);
  const animal = computeAnimal(coreStats, content.animals, matchBaselines.animals);
  const alignment = computeAlignment(coreStats, content.alignments);
  const auraPercent = computeAuraPercent(coreStats);
  const threatLevel = computeThreatLevel(coreStats);
  const lifeExpectancyYears = computeLifeExpectancy(coreStats);
  const worth = computeWorth(coreStats, derivedStats, career, { rng });

  const probabilities = [
    calibratedProbability(appearanceCalibration.careers, career.id, "careers"),
    calibratedProbability(appearanceCalibration.classes, classProfile.id, "classes"),
    calibratedProbability(appearanceCalibration.powers, power.id, "powers"),
    calibratedProbability(appearanceCalibration.weaknesses, weakness.id, "weaknesses"),
    calibratedProbability(appearanceCalibration.abilities, ability.id, "abilities"),
    calibratedProbability(appearanceCalibration.workStyles, workStyle.id, "workStyles"),
    calibratedProbability(appearanceCalibration.animals, animal.id, "animals"),
    calibratedProbability(appearanceCalibration.alignments, alignment.id, "alignments"),
  ];
  const rarity = computeHybridRarity({
    probabilities,
    synergyScore: synergyOutcome.totalRarityScore,
    extremityScore,
  });

  assertPercent("auraPercent", auraPercent);
  assertFiniteResult("threatLevel", threatLevel);
  if (threatLevel < 0 || threatLevel > 10) throw new Error("FinalForm: threatLevel doit rester dans 0..10");
  assertFiniteResult("lifeExpectancyYears", lifeExpectancyYears);
  assertFiniteResult("worth", worth);
  assertFiniteResult("rarity.score", rarity.score);
  if (!Number.isFinite(rarity.oneInX) || rarity.oneInX < 25 || rarity.oneInX > 1_000_000_000) throw new Error("FinalForm: rareté invalide");

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
    rarity,
  };
}
