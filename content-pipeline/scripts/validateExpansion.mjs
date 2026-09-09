import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const dataDir = resolve(root, "src/data");
const load = async (name) => JSON.parse(await readFile(resolve(dataDir, `${name}.json`), "utf8"));

const [questions, questionsExpansion, questionsExtra, questionsMoreWork, questionsMoreSocial, questionsMoreLife, careers, careersExpansion, animals, animalsExpansion, classes, classesExpansion, powers, powersExpansion, weaknesses, weaknessesExpansion, abilities, abilitiesExpansion, workStyles, workStylesExpansion, alignments, resultsExtra, calibration] = await Promise.all([
  load("questions"), load("questions.expansion"), load("questions.extra"),
  load("questions.more.work"), load("questions.more.social"), load("questions.more.life"),
  load("careers"), load("careers.expansion"), load("animals"), load("animals.expansion"),
  load("classes"), load("classes.expansion"), load("powers"), load("powers.expansion"),
  load("weaknesses"), load("weaknesses.expansion"), load("abilities"), load("abilities.expansion"),
  load("workStyles"), load("workStyles.expansion"), load("alignments"), load("results.extra"), load("appearanceCalibration"),
]);

const allQuestions = [...questions, ...questionsExpansion, ...questionsExtra, ...questionsMoreWork, ...questionsMoreSocial, ...questionsMoreLife];
const answerCount = allQuestions.reduce((sum, question) => sum + (question.answers?.length ?? 0), 0);
if (allQuestions.length < 100) throw new Error(`extended questions: ${allQuestions.length} available, at least 100 required`);
if (answerCount < 1000) throw new Error(`extended answers: ${answerCount} available, at least 1000 required`);

const questionIds = new Set();
for (const question of allQuestions) {
  if (!question.id || questionIds.has(question.id)) throw new Error(`extended questions: duplicate/empty id ${question.id}`);
  questionIds.add(question.id);
  if (!Array.isArray(question.answers) || question.answers.length !== 10) throw new Error(`${question.id}: exactly 10 answers required`);
}

const groups = {
  careers: [...careers, ...(resultsExtra.careers ?? []), ...careersExpansion],
  classes: [...classes, ...(resultsExtra.classes ?? []), ...classesExpansion],
  powers: [...powers, ...(resultsExtra.powers ?? []), ...powersExpansion],
  weaknesses: [...weaknesses, ...(resultsExtra.weaknesses ?? []), ...weaknessesExpansion],
  abilities: [...abilities, ...(resultsExtra.abilities ?? []), ...abilitiesExpansion],
  workStyles: [...workStyles, ...(resultsExtra.workStyles ?? []), ...workStylesExpansion],
  animals: [...animals, ...(resultsExtra.animals ?? []), ...animalsExpansion],
  alignments,
};

let calibratedEntries = 0;
for (const [groupName, entries] of Object.entries(groups)) {
  const group = calibration?.[groupName];
  if (!group || typeof group !== "object") throw new Error(`appearance calibration: missing group ${groupName}`);
  let sum = 0;
  for (const entry of entries) {
    const probability = group[entry.id];
    if (!Number.isFinite(probability) || probability <= 0 || probability > 1) throw new Error(`appearance calibration: invalid ${groupName}.${entry.id}`);
    sum += probability;
    calibratedEntries += 1;
  }
  if (Math.abs(sum - 1) > 0.001) throw new Error(`appearance calibration: ${groupName} sums to ${sum}, expected ~1`);
}

console.log(`Extended content OK: questions=${allQuestions.length}, answers=${answerCount}, calibrated=${calibratedEntries}`);
