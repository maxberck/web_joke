import { STAT_KEYS, type AppearanceCalibration, type ContentPack, type MatchBaselines, type StatKey } from "@final-form/shared-types";
import questionsRaw from "./questions.json" with { type: "json" };
import questionsExpansionRaw from "./questions.expansion.json" with { type: "json" };
import questionsExtraRaw from "./questions.extra.json" with { type: "json" };
import questionsMoreWorkRaw from "./questions.more.work.json" with { type: "json" };
import questionsMoreSocialRaw from "./questions.more.social.json" with { type: "json" };
import questionsMoreLifeRaw from "./questions.more.life.json" with { type: "json" };
import careersRaw from "./careers.json" with { type: "json" };
import careersExpansionRaw from "./careers.expansion.json" with { type: "json" };
import animalsRaw from "./animals.json" with { type: "json" };
import animalsExpansionRaw from "./animals.expansion.json" with { type: "json" };
import classesRaw from "./classes.json" with { type: "json" };
import classesExpansionRaw from "./classes.expansion.json" with { type: "json" };
import powersRaw from "./powers.json" with { type: "json" };
import powersExpansionRaw from "./powers.expansion.json" with { type: "json" };
import weaknessesRaw from "./weaknesses.json" with { type: "json" };
import weaknessesExpansionRaw from "./weaknesses.expansion.json" with { type: "json" };
import abilitiesRaw from "./abilities.json" with { type: "json" };
import abilitiesExpansionRaw from "./abilities.expansion.json" with { type: "json" };
import workStylesRaw from "./workStyles.json" with { type: "json" };
import workStylesExpansionRaw from "./workStyles.expansion.json" with { type: "json" };
import alignmentsRaw from "./alignments.json" with { type: "json" };
import synergyRulesRaw from "./synergyRules.json" with { type: "json" };
import synergyRulesExtraRaw from "./synergyRules.extra.json" with { type: "json" };
import synergyRulesExpansionRaw from "./synergyRules.expansion.json" with { type: "json" };
import matchBaselinesRaw from "./matchBaselines.json" with { type: "json" };
import matchBaselinesExtraRaw from "./matchBaselines.extra.json" with { type: "json" };
import matchBaselinesExpansionRaw from "./matchBaselines.expansion.json" with { type: "json" };
import resultsExtraRaw from "./results.extra.json" with { type: "json" };
import rarityDistributionRaw from "./rarityDistribution.json" with { type: "json" };
import appearanceCalibrationRaw from "./appearanceCalibration.json" with { type: "json" };

export interface RarityBucket { minScore: number; oneInX: number; }
const questions = [...questionsRaw, ...questionsExpansionRaw, ...questionsExtraRaw, ...questionsMoreWorkRaw, ...questionsMoreSocialRaw, ...questionsMoreLifeRaw];
const synergyRules = [...synergyRulesRaw, ...synergyRulesExtraRaw, ...synergyRulesExpansionRaw];
const resultLists = {
  careers: [...careersRaw, ...resultsExtraRaw.careers, ...careersExpansionRaw],
  animals: [...animalsRaw, ...resultsExtraRaw.animals, ...animalsExpansionRaw],
  classes: [...classesRaw, ...resultsExtraRaw.classes, ...classesExpansionRaw],
  powers: [...powersRaw, ...resultsExtraRaw.powers, ...powersExpansionRaw],
  weaknesses: [...weaknessesRaw, ...resultsExtraRaw.weaknesses, ...weaknessesExpansionRaw],
  abilities: [...abilitiesRaw, ...resultsExtraRaw.abilities, ...abilitiesExpansionRaw],
  workStyles: [...workStylesRaw, ...resultsExtraRaw.workStyles, ...workStylesExpansionRaw],
  alignments: [...alignmentsRaw],
};
export const contentPack: ContentPack = {
  questions: questions as unknown as ContentPack["questions"], careers: resultLists.careers as unknown as ContentPack["careers"], animals: resultLists.animals as unknown as ContentPack["animals"],
  classes: resultLists.classes as unknown as ContentPack["classes"], powers: resultLists.powers as unknown as ContentPack["powers"], weaknesses: resultLists.weaknesses as unknown as ContentPack["weaknesses"],
  abilities: resultLists.abilities as unknown as ContentPack["abilities"], workStyles: resultLists.workStyles as unknown as ContentPack["workStyles"], alignments: resultLists.alignments as unknown as ContentPack["alignments"],
  synergyRules: synergyRules as unknown as ContentPack["synergyRules"],
};
export const matchBaselines: MatchBaselines = {
  careers: { ...matchBaselinesRaw.careers, ...matchBaselinesExtraRaw.careers, ...matchBaselinesExpansionRaw.careers },
  classes: { ...matchBaselinesRaw.classes, ...matchBaselinesExtraRaw.classes, ...matchBaselinesExpansionRaw.classes },
  powers: { ...matchBaselinesRaw.powers, ...matchBaselinesExtraRaw.powers, ...matchBaselinesExpansionRaw.powers },
  weaknesses: { ...matchBaselinesRaw.weaknesses, ...matchBaselinesExtraRaw.weaknesses, ...matchBaselinesExpansionRaw.weaknesses },
  abilities: { ...matchBaselinesRaw.abilities, ...matchBaselinesExtraRaw.abilities, ...matchBaselinesExpansionRaw.abilities },
  workStyles: { ...matchBaselinesRaw.workStyles, ...matchBaselinesExtraRaw.workStyles, ...matchBaselinesExpansionRaw.workStyles },
  animals: { ...matchBaselinesRaw.animals, ...matchBaselinesExtraRaw.animals, ...matchBaselinesExpansionRaw.animals },
};
export const rarityDistribution: RarityBucket[] = rarityDistributionRaw as unknown as RarityBucket[];
export const appearanceCalibration: AppearanceCalibration = appearanceCalibrationRaw as unknown as AppearanceCalibration;
function assertKnownStatKey(key: string, context: string): asserts key is StatKey { if (!STAT_KEYS.includes(key as StatKey)) throw new Error(`${context}: statistique inconnue « ${key} »`); }
function assertFiniteRange(value: number, context: string): void { if (!Number.isFinite(value) || value < 0 || value > 100) throw new Error(`${context}: valeur attendue dans 0..100`); }
function assertFiniteAxis(value: number, context: string): void { if (!Number.isFinite(value) || value < -100 || value > 100) throw new Error(`${context}: valeur attendue dans -100..100`); }
function validateProfile(profile: Partial<Record<string, number>>, context: string): void { for (const [key, value] of Object.entries(profile)) { assertKnownStatKey(key, context); if (typeof value === "number") assertFiniteRange(value, `${context}.${key}`); } }
function validateAlignmentGrid(pack: ContentPack): void {
  if (pack.alignments.length !== 9) throw new Error(`ContentPack: exactement 9 alignements requis, reçu ${pack.alignments.length}`);
  for (const alignment of pack.alignments) {
    if (alignment.lawfulChaotic.length !== 2 || alignment.selflessSelfInterested.length !== 2) throw new Error(`Alignment ${alignment.id}: axes invalides`);
    for (const value of [...alignment.lawfulChaotic, ...alignment.selflessSelfInterested]) assertFiniteAxis(value, `Alignment ${alignment.id}`);
    if (alignment.lawfulChaotic[0] > alignment.lawfulChaotic[1] || alignment.selflessSelfInterested[0] > alignment.selflessSelfInterested[1]) throw new Error(`Alignment ${alignment.id}: plage inversée`);
  }
  const probes = [-67, 0, 67];
  for (const lawfulChaotic of probes) for (const selflessSelfInterested of probes) {
    const matches = pack.alignments.filter((alignment) => lawfulChaotic >= alignment.lawfulChaotic[0] && lawfulChaotic <= alignment.lawfulChaotic[1] && selflessSelfInterested >= alignment.selflessSelfInterested[0] && selflessSelfInterested <= alignment.selflessSelfInterested[1]);
    if (matches.length !== 1) throw new Error(`Alignments: cellule ${lawfulChaotic}/${selflessSelfInterested} couverte ${matches.length} fois`);
  }
}
export function assertContentPackIsValid(pack: ContentPack): void {
  if (pack.questions.length < 100) throw new Error("ContentPack: au moins 100 questions sont requises");
  const validateIds = (name: string, entries: Array<{ id: string }>) => { const ids = new Set<string>(); for (const entry of entries) { if (!entry.id || ids.has(entry.id)) throw new Error(`ContentPack: ID ${name} dupliqué ou vide: ${entry.id}`); ids.add(entry.id); } };
  validateIds("question", pack.questions); validateIds("career", pack.careers); validateIds("animal", pack.animals); validateIds("class", pack.classes); validateIds("power", pack.powers); validateIds("weakness", pack.weaknesses); validateIds("ability", pack.abilities); validateIds("workStyle", pack.workStyles); validateIds("alignment", pack.alignments); validateIds("synergy", pack.synergyRules);
  for (const question of pack.questions) { if (question.answers.length !== 10) throw new Error(`Question ${question.id}: exactement 10 réponses requises`); validateIds(`answer:${question.id}`, question.answers); for (const answer of question.answers) for (const [key, value] of Object.entries(answer.effects)) { assertKnownStatKey(key, `Réponse ${answer.id}`); if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`Réponse ${answer.id}: effet ${key} non fini`); } }
  for (const list of [pack.careers, pack.animals, pack.classes, pack.powers, pack.weaknesses, pack.abilities, pack.workStyles]) { if (list.length === 0) throw new Error("ContentPack: une table de résultats est vide"); for (const entry of list) validateProfile("lowProfile" in entry ? entry.lowProfile : entry.idealProfile, `Entry ${entry.id}`); }
  validateAlignmentGrid(pack);
  for (const rule of pack.synergyRules) { if (rule.conditions.length === 0 || !Number.isFinite(rule.rarityScore)) throw new Error(`Synergy ${rule.id}: règle invalide`); for (const condition of rule.conditions) { assertKnownStatKey(condition.stat, `Synergy ${rule.id}`); if (!Number.isFinite(condition.value)) throw new Error(`Synergy ${rule.id}: condition non finie`); } }
}
export function assertMatchBaselinesAreValid(baselines: MatchBaselines): void { for (const [group, entries] of Object.entries(baselines) as Array<[keyof MatchBaselines, MatchBaselines[keyof MatchBaselines]]>) for (const [id, baseline] of Object.entries(entries)) if (!Number.isFinite(baseline.mean) || !Number.isFinite(baseline.std) || baseline.std <= 0) throw new Error(`Baseline ${group}.${id}: mean/std invalides`); }
export function assertMatchBaselinesCoverContent(pack: ContentPack, baselines: MatchBaselines): void {
  const groups = { careers: pack.careers, classes: pack.classes, powers: pack.powers, weaknesses: pack.weaknesses, abilities: pack.abilities, workStyles: pack.workStyles, animals: pack.animals };
  for (const [group, entries] of Object.entries(groups) as Array<[keyof MatchBaselines, Array<{ id: string }>]>) for (const entry of entries) if (!baselines[group][entry.id]) throw new Error(`Baseline manquante pour ${group}.${entry.id}`);
}
export function assertAppearanceCalibrationCoversContent(pack: ContentPack, calibration: AppearanceCalibration): void {
  const groups = { careers: pack.careers, classes: pack.classes, powers: pack.powers, weaknesses: pack.weaknesses, abilities: pack.abilities, workStyles: pack.workStyles, animals: pack.animals, alignments: pack.alignments };
  for (const [groupName, entries] of Object.entries(groups) as Array<[keyof AppearanceCalibration, Array<{ id: string }>]>) {
    let sum = 0;
    for (const entry of entries) {
      const probability = calibration[groupName][entry.id] ?? Number.NaN;
      if (!Number.isFinite(probability) || probability <= 0 || probability > 1) throw new Error(`Calibration d'apparition manquante/invalide pour ${groupName}.${entry.id}`);
      sum += probability;
    }
    if (Math.abs(sum - 1) > 0.001) throw new Error(`Calibration ${groupName}: somme ${sum} au lieu de ~1`);
  }
}
export function assertRarityDistributionIsValid(table: RarityBucket[]): void { if (table.length === 0) throw new Error("Rarity: table vide"); let previousScore = -Infinity; let previousOneInX = 0; for (const [index, bucket] of table.entries()) { if (!Number.isFinite(bucket.minScore) || !Number.isFinite(bucket.oneInX) || bucket.oneInX < 25) throw new Error(`Rarity[${index}]: valeur invalide`); if (bucket.minScore < previousScore || bucket.oneInX <= previousOneInX) throw new Error(`Rarity[${index}]: table non monotone`); previousScore = bucket.minScore; previousOneInX = bucket.oneInX; } }
assertContentPackIsValid(contentPack); assertMatchBaselinesAreValid(matchBaselines); assertMatchBaselinesCoverContent(contentPack, matchBaselines); assertAppearanceCalibrationCoversContent(contentPack, appearanceCalibration); assertRarityDistributionIsValid(rarityDistribution);
