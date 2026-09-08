import { STAT_KEYS, type ContentPack, type MatchBaselines, type MatchBaselineSet, type StatKey } from "@final-form/shared-types";
import questionsRaw from "./questions.json" with { type: "json" };
import careersRaw from "./careers.json" with { type: "json" };
import animalsRaw from "./animals.json" with { type: "json" };
import classesRaw from "./classes.json" with { type: "json" };
import powersRaw from "./powers.json" with { type: "json" };
import weaknessesRaw from "./weaknesses.json" with { type: "json" };
import abilitiesRaw from "./abilities.json" with { type: "json" };
import workStylesRaw from "./workStyles.json" with { type: "json" };
import alignmentsRaw from "./alignments.json" with { type: "json" };
import synergyRulesRaw from "./synergyRules.json" with { type: "json" };
import matchBaselinesRaw from "./matchBaselines.json" with { type: "json" };
import rarityDistributionRaw from "./rarityDistribution.json" with { type: "json" };

export interface RarityBucket { minScore: number; oneInX: number; }

export const contentPack: ContentPack = {
  questions: questionsRaw as ContentPack["questions"],
  careers: careersRaw as ContentPack["careers"],
  animals: animalsRaw as ContentPack["animals"],
  classes: classesRaw as ContentPack["classes"],
  powers: powersRaw as ContentPack["powers"],
  weaknesses: weaknessesRaw as ContentPack["weaknesses"],
  abilities: abilitiesRaw as ContentPack["abilities"],
  workStyles: workStylesRaw as ContentPack["workStyles"],
  alignments: alignmentsRaw as ContentPack["alignments"],
  synergyRules: synergyRulesRaw as ContentPack["synergyRules"],
};

export const matchBaselines: MatchBaselines = matchBaselinesRaw as MatchBaselines;
export const rarityDistribution: RarityBucket[] = rarityDistributionRaw as RarityBucket[];

function assertKnownStatKey(key: string, context: string): asserts key is StatKey {
  if (!STAT_KEYS.includes(key as StatKey)) throw new Error(`${context}: statistique inconnue « ${key} »`);
}

function assertFiniteRange(value: number, context: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 100) throw new Error(`${context}: valeur attendue dans 0..100`);
}

function assertAlignmentRange(value: number, context: string): void {
  if (!Number.isFinite(value) || value < -100 || value > 100) throw new Error(`${context}: valeur attendue dans -100..100`);
}

function validateProfile(profile: Partial<Record<string, number>>, context: string): void {
  for (const [key, value] of Object.entries(profile)) {
    assertKnownStatKey(key, context);
    if (typeof value !== "number") throw new Error(`${context}.${key}: valeur numérique attendue`);
    assertFiniteRange(value, `${context}.${key}`);
  }
}

export function assertContentPackIsValid(pack: ContentPack): void {
  if (pack.questions.length < 20) throw new Error("ContentPack: au moins 20 questions sont requises");

  const validateIds = (name: string, entries: Array<{ id: string }>) => {
    const ids = new Set<string>();
    for (const entry of entries) {
      if (!entry.id || ids.has(entry.id)) throw new Error(`ContentPack: ID ${name} dupliqué ou vide: ${entry.id}`);
      ids.add(entry.id);
    }
  };

  validateIds("question", pack.questions);
  validateIds("career", pack.careers);
  validateIds("animal", pack.animals);
  validateIds("class", pack.classes);
  validateIds("power", pack.powers);
  validateIds("weakness", pack.weaknesses);
  validateIds("ability", pack.abilities);
  validateIds("workStyle", pack.workStyles);
  validateIds("alignment", pack.alignments);
  validateIds("synergy", pack.synergyRules);

  for (const question of pack.questions) {
    if (question.answers.length < 3) throw new Error(`Question ${question.id}: moins de 3 réponses`);
    validateIds(`answer:${question.id}`, question.answers);
    for (const answer of question.answers) {
      for (const [key, value] of Object.entries(answer.effects)) {
        assertKnownStatKey(key, `Réponse ${answer.id}`);
        if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`Réponse ${answer.id}: effet ${key} non fini`);
      }
    }
  }

  const resultLists = [pack.careers, pack.animals, pack.classes, pack.powers, pack.weaknesses, pack.abilities, pack.workStyles];
  for (const list of resultLists) {
    if (list.length === 0) throw new Error("ContentPack: une table de résultats est vide");
    for (const entry of list) {
      const profile = "lowProfile" in entry ? entry.lowProfile : entry.idealProfile;
      if (Object.keys(profile).length === 0) throw new Error(`Entry ${entry.id}: profil vide`);
      validateProfile(profile, `Entry ${entry.id}`);
    }
  }

  if (pack.alignments.length === 0) throw new Error("ContentPack: aucune alignment");
  for (const alignment of pack.alignments) {
    if (alignment.lawfulChaotic.length !== 2 || alignment.selflessSelfInterested.length !== 2) throw new Error(`Alignment ${alignment.id}: axes invalides`);
    for (const value of [...alignment.lawfulChaotic, ...alignment.selflessSelfInterested]) {
      assertAlignmentRange(value, `Alignment ${alignment.id}`);
    }
  }

  for (const rule of pack.synergyRules) {
    if (rule.conditions.length === 0 || !Number.isFinite(rule.rarityScore)) throw new Error(`Synergy ${rule.id}: règle invalide`);
    for (const condition of rule.conditions) {
      assertKnownStatKey(condition.stat, `Synergy ${rule.id}`);
      if (!Number.isFinite(condition.value)) throw new Error(`Synergy ${rule.id}: condition non finie`);
    }
  }
}

export function assertMatchBaselinesAreValid(baselines: MatchBaselines): void {
  for (const [group, entries] of Object.entries(baselines) as [keyof MatchBaselines, MatchBaselineSet][]) {
    for (const [id, baseline] of Object.entries(entries)) {
      if (!Number.isFinite(baseline.mean) || !Number.isFinite(baseline.std) || baseline.std <= 0) throw new Error(`Baseline ${group}.${id}: mean/std invalides`);
    }
  }
}

export function assertRarityDistributionIsValid(table: RarityBucket[]): void {
  if (table.length === 0) throw new Error("Rarity: table vide");
  let previousScore = -Infinity;
  let previousOneInX = 0;
  for (const [index, bucket] of table.entries()) {
    if (!Number.isFinite(bucket.minScore) || !Number.isFinite(bucket.oneInX) || bucket.oneInX < 1) throw new Error(`Rarity[${index}]: valeur invalide`);
    if (bucket.minScore < previousScore || bucket.oneInX < previousOneInX) throw new Error(`Rarity[${index}]: table non monotone`);
    previousScore = bucket.minScore;
    previousOneInX = bucket.oneInX;
  }
}

assertContentPackIsValid(contentPack);
assertMatchBaselinesAreValid(matchBaselines);
assertRarityDistributionIsValid(rarityDistribution);
