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
const resultTargets = {
  careers: 100,
  classes: 75,
  powers: 75,
  weaknesses: 75,
  abilities: 75,
  workStyles: 75,
  animals: 75,
};

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const loadData = (name) => readJson(resolve(dataDir, `${name}.json`));
const loadQuestions = (name) => readJson(resolve(questionDir, `${name}.json`));

function assertUniqueIds(entries, label) {
  const ids = new Set();
  for (const entry of entries) {
    assert.ok(entry?.id, `${label}: id vide`);
    assert.equal(ids.has(entry.id), false, `${label}: id dupliqué ${entry.id}`);
    ids.add(entry.id);
  }
  return ids;
}

function assertLocalized(value, label) {
  for (const locale of locales) {
    assert.equal(typeof value?.[locale], "string", `${label}: traduction ${locale} manquante`);
    assert.ok(value[locale].trim().length > 0, `${label}: traduction ${locale} vide`);
  }
}

function assertProfile(profile, label) {
  assert.ok(profile && Object.keys(profile).length > 0, `${label}: profil vide`);
  for (const [stat, value] of Object.entries(profile)) {
    assert.ok(statKeys.has(stat), `${label}: statistique inconnue ${stat}`);
    assert.ok(Number.isFinite(value) && value >= 0 && value <= 100, `${label}.${stat}: valeur hors 0..100`);
  }
}

const questionParts = await Promise.all(questionFiles.map(loadQuestions));
for (let index = 0; index < questionFiles.length; index += 1) {
  assert.equal(
    questionParts[index].length,
    30,
    `${questionFiles[index]}.json: exactement 30 questions requises`,
  );
}

const questions = questionParts.flat();
assert.equal(questions.length, 150, `questions: ${questions.length} au lieu de 150`);
assertUniqueIds(questions, "questions");

let answerCount = 0;
for (const question of questions) {
  assertLocalized(question.text, `question ${question.id}`);
  assert.equal(question.answers?.length, 10, `question ${question.id}: exactement 10 réponses requises`);
  assertUniqueIds(question.answers, `answers:${question.id}`);
  if (question.selectionWeight !== undefined) {
    assert.ok(Number.isFinite(question.selectionWeight) && question.selectionWeight >= 0, `question ${question.id}: selectionWeight invalide`);
  }
  for (const answer of question.answers) {
    answerCount += 1;
    assertLocalized(answer.text, `answer ${question.id}/${answer.id}`);
    if (answer.selectionWeight !== undefined) {
      assert.ok(Number.isFinite(answer.selectionWeight) && answer.selectionWeight >= 0, `answer ${question.id}/${answer.id}: selectionWeight invalide`);
    }
    for (const [stat, value] of Object.entries(answer.effects ?? {})) {
      assert.ok(statKeys.has(stat), `answer ${question.id}/${answer.id}: statistique inconnue ${stat}`);
      assert.ok(Number.isFinite(value), `answer ${question.id}/${answer.id}: effet ${stat} non fini`);
    }
  }
}
assert.equal(answerCount, 1500, `answers: ${answerCount} au lieu de 1500`);

const resultGroups = Object.fromEntries(
  await Promise.all(Object.keys(resultTargets).map(async (name) => [name, await loadData(name)])),
);
for (const [group, target] of Object.entries(resultTargets)) {
  const entries = resultGroups[group];
  assert.equal(entries.length, target, `${group}: ${entries.length} au lieu de ${target}`);
  assertUniqueIds(entries, group);
  for (const entry of entries) {
    assertLocalized(entry.name ?? entry.text, `${group} ${entry.id}`);
    assertProfile(entry.lowProfile ?? entry.idealProfile, `${group} ${entry.id}`);
    if (group === "animals") assertLocalized(entry.description, `animals ${entry.id} description`);
    if (group === "careers") {
      assert.ok(entry.worthPotential, `careers ${entry.id}: worthPotential manquant`);
    }
    if (entry.worthPotential) {
      assert.ok(Number.isFinite(entry.worthPotential.min), `${group} ${entry.id}: worthPotential.min invalide`);
      assert.ok(Number.isFinite(entry.worthPotential.max), `${group} ${entry.id}: worthPotential.max invalide`);
      assert.ok(entry.worthPotential.min <= entry.worthPotential.max, `${group} ${entry.id}: worthPotential inversé`);
    }
  }
}

const alignments = await loadData("alignments");
assert.equal(alignments.length, 9, `alignments: ${alignments.length} au lieu de 9`);
assertUniqueIds(alignments, "alignments");
for (const alignment of alignments) {
  assertLocalized(alignment.name, `alignment ${alignment.id}`);
  assertLocalized(alignment.description, `alignment ${alignment.id} description`);
  assert.equal(alignment.lawfulChaotic?.length, 2, `alignment ${alignment.id}: lawfulChaotic invalide`);
  assert.equal(alignment.selflessSelfInterested?.length, 2, `alignment ${alignment.id}: selflessSelfInterested invalide`);
  for (const value of [...alignment.lawfulChaotic, ...alignment.selflessSelfInterested]) {
    assert.ok(Number.isFinite(value) && value >= -100 && value <= 100, `alignment ${alignment.id}: axe hors -100..100`);
  }
}

const synergyRules = await loadData("synergyRules");
assert.ok(synergyRules.length >= 90 && synergyRules.length <= 110, `synergyRules: ${synergyRules.length}, attendu 90..110`);
assertUniqueIds(synergyRules, "synergyRules");
for (const rule of synergyRules) {
  assert.ok(Array.isArray(rule.conditions) && rule.conditions.length > 0, `synergy ${rule.id}: conditions vides`);
  assert.ok(Number.isFinite(rule.weight) && rule.weight >= 0, `synergy ${rule.id}: weight invalide`);
  assert.ok(Number.isFinite(rule.rarityScore) && rule.rarityScore >= 0, `synergy ${rule.id}: rarityScore invalide`);
  for (const condition of rule.conditions) {
    assert.ok(statKeys.has(condition.stat), `synergy ${rule.id}: statistique inconnue ${condition.stat}`);
    assert.ok([">", ">=", "<", "<=", "=="].includes(condition.op), `synergy ${rule.id}: opérateur invalide ${condition.op}`);
    assert.ok(Number.isFinite(condition.value), `synergy ${rule.id}: valeur non finie`);
  }
}

const baselines = await loadData("matchBaselines");
for (const [group, entries] of Object.entries(resultGroups)) {
  const expectedIds = new Set(entries.map((entry) => entry.id));
  const baselineEntries = baselines[group] ?? {};
  assert.equal(Object.keys(baselineEntries).length, expectedIds.size, `${group}: couverture baseline non exacte`);
  for (const id of expectedIds) {
    const baseline = baselineEntries[id];
    assert.ok(baseline, `${group}.${id}: baseline manquante`);
    assert.ok(Number.isFinite(baseline.mean), `${group}.${id}: mean invalide`);
    assert.ok(Number.isFinite(baseline.std) && baseline.std > 0, `${group}.${id}: std invalide`);
  }
}

const calibration = await loadData("appearanceCalibration");
const calibrationGroups = { ...resultGroups, alignments };
for (const [group, entries] of Object.entries(calibrationGroups)) {
  const expectedIds = new Set(entries.map((entry) => entry.id));
  const probabilities = calibration[group] ?? {};
  assert.equal(Object.keys(probabilities).length, expectedIds.size, `${group}: couverture calibration non exacte`);
  let sum = 0;
  for (const id of expectedIds) {
    const value = probabilities[id];
    assert.ok(Number.isFinite(value) && value > 0 && value <= 1, `${group}.${id}: probabilité invalide`);
    sum += value;
  }
  assert.ok(Math.abs(sum - 1) <= 0.001, `${group}: somme calibration ${sum} au lieu de ~1`);
}

console.log(
  `Content canonique OK: questions=${questions.length}, answers=${answerCount}, careers=${resultGroups.careers.length}, classes=${resultGroups.classes.length}, powers=${resultGroups.powers.length}, weaknesses=${resultGroups.weaknesses.length}, abilities=${resultGroups.abilities.length}, workStyles=${resultGroups.workStyles.length}, animals=${resultGroups.animals.length}, alignments=${alignments.length}, synergies=${synergyRules.length}`,
);
