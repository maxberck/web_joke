import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const dataDir = resolve(root, "src/data");
const files = ["questions", "careers", "animals", "classes", "powers", "weaknesses", "abilities", "workStyles", "alignments", "synergyRules"];
const locales = ["en", "fr", "es"];
const statKeys = new Set([
  "intelligence", "creativity", "emotionalControl", "empathy", "social",
  "communication", "ambition", "discipline", "professionalism", "financialSense",
  "risk", "luck", "energy", "humor", "chaos",
]);

const load = async (name) => JSON.parse(await readFile(resolve(dataDir, `${name}.json`), "utf8"));
const seen = (entries, label) => {
  const ids = new Set();
  for (const entry of entries) {
    if (!entry?.id || ids.has(entry.id)) throw new Error(`${label}: duplicate/empty id ${entry?.id ?? "<empty>"}`);
    ids.add(entry.id);
  }
  return ids;
};
const finiteRange = (value, label) => {
  if (!Number.isFinite(value) || value < 0 || value > 100) throw new Error(`${label}: expected finite value in 0..100`);
};
const finiteAxis = (value, label) => {
  if (!Number.isFinite(value) || value < -100 || value > 100) throw new Error(`${label}: expected finite value in -100..100`);
};
const localized = (value, label) => {
  for (const locale of locales) {
    if (typeof value?.[locale] !== "string" || value[locale].trim() === "") {
      throw new Error(`${label}: missing ${locale}`);
    }
  }
};
const validateProfile = (profile, label) => {
  if (!profile || Object.keys(profile).length === 0) throw new Error(`${label}: empty profile`);
  for (const [stat, value] of Object.entries(profile)) {
    if (!statKeys.has(stat)) throw new Error(`${label}: unknown stat ${stat}`);
    finiteRange(value, `${label}.${stat}`);
  }
};
const getLocalizedLabel = (entry) => entry.name ?? entry.text;

const data = Object.fromEntries(await Promise.all(files.map(async (name) => [name, await load(name)])));
if (data.questions.length < 20) throw new Error(`questions: ${data.questions.length} available, at least 20 required`);
seen(data.questions, "questions");
for (const question of data.questions) {
  localized(question.text, `question ${question.id}`);
  seen(question.answers, `answers for ${question.id}`);
  if (question.answers.length < 3) throw new Error(`question ${question.id}: fewer than 3 answers`);
  for (const answer of question.answers) {
    localized(answer.text, `answer ${answer.id}`);
    if (answer.selectionWeight !== undefined && (!Number.isFinite(answer.selectionWeight) || answer.selectionWeight < 0)) {
      throw new Error(`answer ${answer.id}: invalid selectionWeight`);
    }
    for (const [stat, value] of Object.entries(answer.effects ?? {})) {
      if (!statKeys.has(stat)) throw new Error(`answer ${answer.id}: unknown stat ${stat}`);
      if (!Number.isFinite(value)) throw new Error(`answer ${answer.id}: invalid effect ${stat}`);
    }
  }
  if (question.selectionWeight !== undefined && (!Number.isFinite(question.selectionWeight) || question.selectionWeight < 0)) {
    throw new Error(`question ${question.id}: invalid selectionWeight`);
  }
}

const resultGroups = {
  careers: data.careers,
  classes: data.classes,
  powers: data.powers,
  weaknesses: data.weaknesses,
  abilities: data.abilities,
  workStyles: data.workStyles,
  animals: data.animals,
};
const resultIds = {};
for (const [name, entries] of Object.entries(resultGroups)) {
  resultIds[name] = seen(entries, name);
  for (const entry of entries) {
    localized(getLocalizedLabel(entry), `${name} ${entry.id}`);
    validateProfile(entry.lowProfile ?? entry.idealProfile, `${name} ${entry.id}`);
  }
}

seen(data.alignments, "alignments");
seen(data.synergyRules, "synergyRules");
for (const alignment of data.alignments) {
  localized(getLocalizedLabel(alignment), `alignment ${alignment.id}`);
  if (alignment.lawfulChaotic?.length !== 2 || alignment.selflessSelfInterested?.length !== 2) throw new Error(`alignment ${alignment.id}: invalid axes`);
  for (const value of [...alignment.lawfulChaotic, ...alignment.selflessSelfInterested]) finiteAxis(value, `alignment ${alignment.id}`);
}
for (const rule of data.synergyRules) {
  if (!Array.isArray(rule.conditions) || rule.conditions.length === 0) throw new Error(`synergy ${rule.id}: empty conditions`);
  if (!Number.isFinite(rule.rarityScore)) throw new Error(`synergy ${rule.id}: invalid rarity score`);
  if (!Number.isFinite(rule.weight) || rule.weight < 0) throw new Error(`synergy ${rule.id}: invalid weight`);
  for (const condition of rule.conditions) {
    if (!statKeys.has(condition.stat)) throw new Error(`synergy ${rule.id}: unknown stat ${condition.stat}`);
    if (!Number.isFinite(condition.value)) throw new Error(`synergy ${rule.id}: invalid condition value`);
  }
}

const baselines = JSON.parse(await readFile(resolve(dataDir, "matchBaselines.json"), "utf8"));
const baselineGroups = Object.keys(resultGroups);
for (const group of baselineGroups) {
  const entries = baselines[group];
  if (!entries || typeof entries !== "object") throw new Error(`baseline ${group}: group missing`);
  for (const id of resultIds[group]) {
    if (!entries[id]) throw new Error(`baseline ${group}.${id}: missing entity baseline`);
  }
  for (const [id, baseline] of Object.entries(entries)) {
    if (!resultIds[group].has(id)) throw new Error(`baseline ${group}.${id}: unknown entity`);
    if (!Number.isFinite(baseline.mean) || !Number.isFinite(baseline.std) || baseline.std <= 0) {
      throw new Error(`baseline ${group}.${id}: mean/std invalid`);
    }
  }
}

const rarity = JSON.parse(await readFile(resolve(dataDir, "rarityDistribution.json"), "utf8"));
if (!Array.isArray(rarity) || rarity.length === 0) throw new Error("rarity: empty table");
let previousScore = -Infinity;
let previousOneInX = 0;
for (const [index, bucket] of rarity.entries()) {
  if (!Number.isFinite(bucket.minScore) || !Number.isFinite(bucket.oneInX) || bucket.oneInX < 1) throw new Error(`rarity[${index}]: invalid bucket`);
  if (bucket.minScore < previousScore || bucket.oneInX < previousOneInX) throw new Error(`rarity[${index}]: table is not monotone`);
  previousScore = bucket.minScore;
  previousOneInX = bucket.oneInX;
}

console.log(`Content validation passed: ${data.questions.length} questions, ${data.careers.length} careers, ${data.classes.length} classes.`);