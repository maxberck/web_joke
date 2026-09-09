import {
  STAT_KEYS,
  type AppearanceCalibration,
  type ContentPack,
  type MatchBaselines,
  type StatKey,
} from "@final-form/shared-types";

import questionsWorkRaw from "./questions/work.json" with { type: "json" };
import questionsSocialRaw from "./questions/social.json" with { type: "json" };
import questionsLifeRaw from "./questions/life.json" with { type: "json" };
import questionsPersonalityRaw from "./questions/personality.json" with { type: "json" };
import questionsGeneralRaw from "./questions/general.json" with { type: "json" };
import careersRaw from "./careers.json" with { type: "json" };
import classesRaw from "./classes.json" with { type: "json" };
import powersRaw from "./powers.json" with { type: "json" };
import weaknessesRaw from "./weaknesses.json" with { type: "json" };
import abilitiesRaw from "./abilities.json" with { type: "json" };
import workStylesRaw from "./workStyles.json" with { type: "json" };
import animalsRaw from "./animals.json" with { type: "json" };
import alignmentsRaw from "./alignments.json" with { type: "json" };
import synergyRulesRaw from "./synergyRules.json" with { type: "json" };
import matchBaselinesRaw from "./matchBaselines.json" with { type: "json" };
import appearanceCalibrationRaw from "./appearanceCalibration.json" with { type: "json" };

const questions = [
  ...questionsWorkRaw,
  ...questionsSocialRaw,
  ...questionsLifeRaw,
  ...questionsPersonalityRaw,
  ...questionsGeneralRaw,
];

export const contentPack: ContentPack = {
  questions: questions as unknown as ContentPack["questions"],
  careers: careersRaw as unknown as ContentPack["careers"],
  classes: classesRaw as unknown as ContentPack["classes"],
  powers: powersRaw as unknown as ContentPack["powers"],
  weaknesses: weaknessesRaw as unknown as ContentPack["weaknesses"],
  abilities: abilitiesRaw as unknown as ContentPack["abilities"],
  workStyles: workStylesRaw as unknown as ContentPack["workStyles"],
  animals: animalsRaw as unknown as ContentPack["animals"],
  alignments: alignmentsRaw as unknown as ContentPack["alignments"],
  synergyRules: synergyRulesRaw as unknown as ContentPack["synergyRules"],
};

export const matchBaselines = matchBaselinesRaw as unknown as MatchBaselines;
export const appearanceCalibration = appearanceCalibrationRaw as unknown as AppearanceCalibration;

function assertKnownStatKey(key: string, context: string): asserts key is StatKey {
  if (!STAT_KEYS.includes(key as StatKey)) {
    throw new Error(`${context}: statistique inconnue « ${key} »`);
  }
}

function assertFiniteRange(value: number, context: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error(`${context}: valeur attendue dans 0..100`);
  }
}

function assertFiniteAxis(value: number, context: string): void {
  if (!Number.isFinite(value) || value < -100 || value > 100) {
    throw new Error(`${context}: valeur attendue dans -100..100`);
  }
}

function validateProfile(profile: Partial<Record<string, number>>, context: string): void {
  for (const [key, value] of Object.entries(profile)) {
    assertKnownStatKey(key, context);
    if (typeof value === "number") assertFiniteRange(value, `${context}.${key}`);
  }
}

function validateAlignmentGrid(pack: ContentPack): void {
  if (pack.alignments.length !== 9) {
    throw new Error(`ContentPack: exactement 9 alignements requis, reçu ${pack.alignments.length}`);
  }

  for (const alignment of pack.alignments) {
    if (alignment.lawfulChaotic.length !== 2 || alignment.selflessSelfInterested.length !== 2) {
      throw new Error(`Alignment ${alignment.id}: axes invalides`);
    }
    for (const value of [...alignment.lawfulChaotic, ...alignment.selflessSelfInterested]) {
      assertFiniteAxis(value, `Alignment ${alignment.id}`);
    }
    if (
      alignment.lawfulChaotic[0] > alignment.lawfulChaotic[1]
      || alignment.selflessSelfInterested[0] > alignment.selflessSelfInterested[1]
    ) {
      throw new Error(`Alignment ${alignment.id}: plage inversée`);
    }
  }

  const probes = [-67, 0, 67];
  for (const lawfulChaotic of probes) {
    for (const selflessSelfInterested of probes) {
      const matches = pack.alignments.filter(
        (alignment) => lawfulChaotic >= alignment.lawfulChaotic[0]
          && lawfulChaotic <= alignment.lawfulChaotic[1]
          && selflessSelfInterested >= alignment.selflessSelfInterested[0]
          && selflessSelfInterested <= alignment.selflessSelfInterested[1],
      );
      if (matches.length !== 1) {
        throw new Error(`Alignments: cellule ${lawfulChaotic}/${selflessSelfInterested} couverte ${matches.length} fois`);
      }
    }
  }
}

export function assertContentPackIsValid(pack: ContentPack): void {
  if (pack.questions.length < 100) {
    throw new Error("ContentPack: au moins 100 questions sont requises");
  }

  const validateIds = (name: string, entries: Array<{ id: string }>) => {
    const ids = new Set<string>();
    for (const entry of entries) {
      if (!entry.id || ids.has(entry.id)) {
        throw new Error(`ContentPack: ID ${name} dupliqué ou vide: ${entry.id}`);
      }
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
    if (question.answers.length !== 10) {
      throw new Error(`Question ${question.id}: exactement 10 réponses requises`);
    }
    validateIds(`answer:${question.id}`, question.answers);
    for (const answer of question.answers) {
      for (const [key, value] of Object.entries(answer.effects)) {
        assertKnownStatKey(key, `Réponse ${answer.id}`);
        if (typeof value !== "number" || !Number.isFinite(value)) {
          throw new Error(`Réponse ${answer.id}: effet ${key} non fini`);
        }
      }
    }
  }

  for (const list of [
    pack.careers,
    pack.animals,
    pack.classes,
    pack.powers,
    pack.weaknesses,
    pack.abilities,
    pack.workStyles,
  ]) {
    if (list.length === 0) throw new Error("ContentPack: une table de résultats est vide");
    for (const entry of list) {
      validateProfile("lowProfile" in entry ? entry.lowProfile : entry.idealProfile, `Entry ${entry.id}`);
    }
  }

  validateAlignmentGrid(pack);

  for (const rule of pack.synergyRules) {
    if (rule.conditions.length === 0 || !Number.isFinite(rule.rarityScore)) {
      throw new Error(`Synergy ${rule.id}: règle invalide`);
    }
    for (const condition of rule.conditions) {
      assertKnownStatKey(condition.stat, `Synergy ${rule.id}`);
      if (!Number.isFinite(condition.value)) {
        throw new Error(`Synergy ${rule.id}: condition non finie`);
      }
    }
  }
}

export function assertMatchBaselinesAreValid(baselines: MatchBaselines): void {
  for (const [group, entries] of Object.entries(baselines) as Array<[
    keyof MatchBaselines,
    MatchBaselines[keyof MatchBaselines],
  ]>) {
    for (const [id, baseline] of Object.entries(entries)) {
      if (!Number.isFinite(baseline.mean) || !Number.isFinite(baseline.std) || baseline.std <= 0) {
        throw new Error(`Baseline ${group}.${id}: mean/std invalides`);
      }
    }
  }
}

export function assertMatchBaselinesCoverContent(pack: ContentPack, baselines: MatchBaselines): void {
  const groups = {
    careers: pack.careers,
    classes: pack.classes,
    powers: pack.powers,
    weaknesses: pack.weaknesses,
    abilities: pack.abilities,
    workStyles: pack.workStyles,
    animals: pack.animals,
  };
  for (const [group, entries] of Object.entries(groups) as Array<[
    keyof MatchBaselines,
    Array<{ id: string }>,
  ]>) {
    for (const entry of entries) {
      if (!baselines[group][entry.id]) {
        throw new Error(`Baseline manquante pour ${group}.${entry.id}`);
      }
    }
  }
}

export function assertAppearanceCalibrationCoversContent(
  pack: ContentPack,
  calibration: AppearanceCalibration,
): void {
  const groups = {
    careers: pack.careers,
    classes: pack.classes,
    powers: pack.powers,
    weaknesses: pack.weaknesses,
    abilities: pack.abilities,
    workStyles: pack.workStyles,
    animals: pack.animals,
    alignments: pack.alignments,
  };

  for (const [groupName, entries] of Object.entries(groups) as Array<[
    keyof AppearanceCalibration,
    Array<{ id: string }>,
  ]>) {
    let sum = 0;
    for (const entry of entries) {
      const probability = calibration[groupName][entry.id] ?? Number.NaN;
      if (!Number.isFinite(probability) || probability <= 0 || probability > 1) {
        throw new Error(`Calibration d'apparition manquante/invalide pour ${groupName}.${entry.id}`);
      }
      sum += probability;
    }
    if (Math.abs(sum - 1) > 0.001) {
      throw new Error(`Calibration ${groupName}: somme ${sum} au lieu de ~1`);
    }
  }
}

assertContentPackIsValid(contentPack);
assertMatchBaselinesAreValid(matchBaselines);
assertMatchBaselinesCoverContent(contentPack, matchBaselines);
assertAppearanceCalibrationCoversContent(contentPack, appearanceCalibration);
