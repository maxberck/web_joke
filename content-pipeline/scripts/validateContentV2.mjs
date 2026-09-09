import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const dataDir = resolve(root, "src/data");
const questionDir = resolve(dataDir, "questions");
const locales = ["en", "fr", "es"];
const questionFiles = ["work", "social", "life", "personality", "general"];
const statKeys = new Set([
  "intelligence", "creativity", "emotionalControl", "empathy", "social",
  "communication", "ambition", "discipline", "professionalism", "financialSense",
  "risk", "luck", "energy", "humor", "chaos",
]);
const targets = {
  careers: 200,
  classes: 150,
  powers: 150,
  weaknesses: 150,
  abilities: 150,
  workStyles: 150,
  animals: 150,
};

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const load = (name) => readJson(resolve(dataDir, `${name}.json`));
const loadQ = (name) => readJson(resolve(questionDir, `${name}.json`));

function unique(entries, label) {
  const ids = new Set();
  for (const entry of entries) {
    assert.ok(entry?.id, `${label}: id vide`);
    assert.equal(ids.has(entry.id), false, `${label}: id dupliqué ${entry.id}`);
    ids.add(entry.id);
  }
  return ids;
}

function localized(value, label) {
  for (const locale of locales) {
    assert.equal(typeof value?.[locale], "string", `${label}: ${locale} manquant`);
    assert.ok(value[locale].trim(), `${label}: ${locale} vide`);
  }
}

function profile(value, label) {
  assert.ok(value && Object.keys(value).length, `${label}: profil vide`);
  for (const [key, statValue] of Object.entries(value)) {
    assert.ok(statKeys.has(key), `${label}: stat inconnue ${key}`);
    assert.ok(Number.isFinite(statValue) && statValue >= 0 && statValue <= 100, `${label}.${key}: hors 0..100`);
  }
}

function semanticDescriptionSignature(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^[^:]{1,90}:\s*/, "")
    .replace(/[\p{P}\p{S}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function editorialDescription(description, displayLabel, context) {
  localized(description, `${context}.description`);
  for (const locale of locales) {
    const text = description[locale].trim();
    const label = displayLabel[locale].trim();
    const words = text.split(/\s+/).filter(Boolean);
    assert.ok(text.length >= 55, `${context}.description.${locale}: description trop courte (${text.length} caractères)`);
    assert.ok(words.length >= 9, `${context}.description.${locale}: au moins 9 mots requis`);
    assert.notEqual(text.toLowerCase(), label.toLowerCase(), `${context}.description.${locale}: description identique au nom`);
  }
}

const parts = await Promise.all(questionFiles.map(loadQ));
parts.forEach((part, index) => assert.equal(part.length, 30, `${questionFiles[index]}.json: 30 questions requises`));
const questions = parts.flat();
assert.equal(questions.length, 150, "150 questions requises");
unique(questions, "questions");
let answers = 0;
for (const question of questions) {
  localized(question.text, `question ${question.id}`);
  assert.equal(question.answers?.length, 10, `${question.id}: 10 réponses requises`);
  unique(question.answers, `answers:${question.id}`);
  for (const answer of question.answers) {
    answers += 1;
    localized(answer.text, `${question.id}/${answer.id}`);
    for (const [key, value] of Object.entries(answer.effects ?? {})) {
      assert.ok(statKeys.has(key), `${question.id}/${answer.id}: stat inconnue ${key}`);
      assert.ok(Number.isFinite(value), `${question.id}/${answer.id}: effet non fini`);
    }
  }
}
assert.equal(answers, 1500, "1500 réponses requises");

const groups = Object.fromEntries(await Promise.all(Object.keys(targets).map(async (name) => [name, await load(name)])));
for (const [group, target] of Object.entries(targets)) {
  const entries = groups[group];
  assert.equal(entries.length, target, `${group}: ${entries.length} au lieu de ${target}`);
  unique(entries, group);
  const signaturesByLocale = Object.fromEntries(locales.map((locale) => [locale, new Set()]));

  for (const entry of entries) {
    const displayLabel = entry.name ?? entry.text;
    localized(displayLabel, `${group}.${entry.id}`);
    editorialDescription(entry.description, displayLabel, `${group}.${entry.id}`);
    profile(entry.lowProfile ?? entry.idealProfile, `${group}.${entry.id}`);

    for (const locale of locales) {
      const signature = semanticDescriptionSignature(entry.description[locale]);
      assert.ok(signature.length >= 35, `${group}.${entry.id}.description.${locale}: contenu sémantique insuffisant`);
      assert.equal(
        signaturesByLocale[locale].has(signature),
        false,
        `${group}.${entry.id}.description.${locale}: description éditoriale dupliquée`,
      );
      signaturesByLocale[locale].add(signature);
    }

    if (group === "careers") assert.ok(entry.worthPotential, `${group}.${entry.id}: worthPotential manquant`);
    if (entry.worthPotential) {
      assert.ok(
        Number.isFinite(entry.worthPotential.min)
          && Number.isFinite(entry.worthPotential.max)
          && entry.worthPotential.min <= entry.worthPotential.max,
        `${group}.${entry.id}: worthPotential invalide`,
      );
    }
  }
}

const alignments = await load("alignments");
assert.equal(alignments.length, 9, "9 alignements requis");
unique(alignments, "alignments");
for (const alignment of alignments) {
  localized(alignment.name, `alignment.${alignment.id}`);
  localized(alignment.description, `alignment.${alignment.id}.description`);
}

const synergies = await load("synergyRules");
assert.equal(synergies.length, 200, `synergies: ${synergies.length} au lieu de 200`);
unique(synergies, "synergies");
for (const rule of synergies) {
  assert.ok(Array.isArray(rule.conditions) && rule.conditions.length, `${rule.id}: conditions vides`);
  assert.ok(Number.isFinite(rule.weight) && rule.weight >= 0, `${rule.id}: weight invalide`);
  assert.ok(Number.isFinite(rule.rarityScore) && rule.rarityScore >= 0, `${rule.id}: rarityScore invalide`);
  for (const condition of rule.conditions) {
    assert.ok(statKeys.has(condition.stat), `${rule.id}: stat inconnue ${condition.stat}`);
    assert.ok([">", ">=", "<", "<=", "=="].includes(condition.op), `${rule.id}: op invalide`);
    assert.ok(Number.isFinite(condition.value), `${rule.id}: valeur invalide`);
  }
}

const baselines = await load("matchBaselines");
for (const [group, entries] of Object.entries(groups)) {
  const expected = new Set(entries.map((entry) => entry.id));
  const actual = baselines[group] ?? {};
  assert.equal(Object.keys(actual).length, expected.size, `${group}: couverture baseline non exacte`);
  for (const id of expected) {
    const baseline = actual[id];
    assert.ok(baseline && Number.isFinite(baseline.mean) && Number.isFinite(baseline.std) && baseline.std > 0, `${group}.${id}: baseline invalide`);
  }
}

const calibration = await load("appearanceCalibration");
for (const [group, entries] of Object.entries({ ...groups, alignments })) {
  const expected = new Set(entries.map((entry) => entry.id));
  const actual = calibration[group] ?? {};
  assert.equal(Object.keys(actual).length, expected.size, `${group}: couverture calibration non exacte`);
  let sum = 0;
  for (const id of expected) {
    const probability = actual[id];
    assert.ok(Number.isFinite(probability) && probability > 0 && probability <= 1, `${group}.${id}: probabilité invalide`);
    sum += probability;
  }
  assert.ok(Math.abs(sum - 1) <= 0.001, `${group}: somme calibration ${sum}`);
}

const indexSource = await readFile(resolve(dataDir, "index.ts"), "utf8");
for (const token of ["questions.extra", "questions.expansion", "questions.more", "results.extra", ".expansion.json", "synergyRules.extra", "matchBaselines.extra"]) {
  assert.equal(indexSource.includes(token), false, `index.ts contient encore ${token}`);
}

console.log(`Content V2 OK: questions=${questions.length}, answers=${answers}, careers=${groups.careers.length}, autres=150, synergies=${synergies.length}, alignments=${alignments.length}`);
