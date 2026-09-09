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
const questionsExpansion = await load("questions.expansion");
const questionsExtra = await load("questions.extra");
const synergyRulesExtra = await load("synergyRules.extra");
const resultsExtra = await load("results.extra");
const rarityDistribution = await load("rarityDistribution");
data.questions = [...data.questions, ...questionsExpansion, ...questionsExtra];
data.synergyRules = [...data.synergyRules, ...synergyRulesExtra];

if (data.questions.length < 20) throw new Error(`questions: ${data.questions.length} available, at least 20 required`);
seen(data.questions, "questions");
for (const question of data.questions) {
  localized(question.text, `question ${question.id}`);
  seen(question.answers, `answers for ${question.id}`);
  if (question.answers.length !== 10) throw new Error(`question ${question.id}: exactly 10 answers required, got ${question.answers.length}`);
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
  careers: [...data.careers, ...(resultsExtra.careers ?? [])],
  classes: [...data.classes, ...(resultsExtra.classes ?? [])],
  powers: [...data.powers, ...(resultsExtra.powers ?? [])],
  weaknesses: [...data.weaknesses, ...(resultsExtra.weaknesses ?? [])],
  abilities: [...data.abilities, ...(resultsExtra.abilities ?? [])],
  workStyles: [...data.workStyles, ...(resultsExtra.workStyles ?? [])],
  animals: [...data.animals, ...(resultsExtra.animals ?? [])],
};
const resultIds = {};
for (const [name, entries] of Object.entries(resultGroups)) {
  resultIds[name] = seen(entries, name);
  for (const entry of entries) {
    localized(getLocalizedLabel(entry), `${name} ${entry.id}`);
    validateProfile(entry.lowProfile ?? entry.idealProfile, `${name} ${entry.id}`);
    if (name === "animals") localized(entry.description, `animals ${entry.id} description`);
    if (entry.worthPotential) {
      if (!Number.isFinite(entry.worthPotential.min) || !Number.isFinite(entry.worthPotential.max) || entry.worthPotential.min > entry.worthPotential.max) {
        throw new Error(`${name} ${entry.id}: invalid worthPotential`);
      }
    }
  }
}

if (!Array.isArray(rarityDistribution) || rarityDistribution.length === 0) throw new Error("rarityDistribution: empty table");
let previousOneInX = 0;
for (const [index, bucket] of rarityDistribution.entries()) {
  if (!Number.isFinite(bucket.minScore)) throw new Error(`rarityDistribution[${index}]: invalid minScore`);
  if (!Number.isInteger(bucket.oneInX) || bucket.oneInX < 25) throw new Error(`rarityDistribution[${index}]: oneInX must be an integer >= 25`);
  if (bucket.oneInX <= previousOneInX) throw new Error(`rarityDistribution[${index}]: oneInX must increase strictly`);
  previousOneInX = bucket.oneInX;
}

seen(data.alignments, "alignments");
for (const alignment of data.alignments) {
  localized(alignment.name, `alignment ${alignment.id}`);
  localized(alignment.description, `alignment ${alignment.id}`);
  if (alignment.lawfulChaotic?.length !== 2 || alignment.selflessSelfInterested?.length !== 2) throw new Error(`alignment ${alignment.id}: invalid axes`);
  [...alignment.lawfulChaotic, ...alignment.selflessSelfInterested].forEach((value) => finiteAxis(value, `alignment ${alignment.id}`));
}

seen(data.synergyRules, "synergyRules");
for (const rule of data.synergyRules) {
  if (!Array.isArray(rule.conditions) || rule.conditions.length === 0) throw new Error(`synergy ${rule.id}: empty conditions`);
  if (!Number.isFinite(rule.weight) || rule.weight < 0) throw new Error(`synergy ${rule.id}: invalid weight`);
  if (!Number.isFinite(rule.rarityScore) || rule.rarityScore < 0) throw new Error(`synergy ${rule.id}: invalid rarityScore`);
  for (const condition of rule.conditions) {
    if (!statKeys.has(condition.stat)) throw new Error(`synergy ${rule.id}: unknown stat ${condition.stat}`);
    if (!Number.isFinite(condition.value)) throw new Error(`synergy ${rule.id}: invalid condition value`);
    if (![">", ">=", "<", "<=", "=="].includes(condition.op)) throw new Error(`synergy ${rule.id}: invalid operator ${condition.op}`);
  }
}

console.log(`Content OK: ${data.questions.length} questions, ${data.synergyRules.length} synergy rules, ${Object.entries(resultGroups).map(([name, entries]) => `${name}=${entries.length}`).join(", ")}`);
