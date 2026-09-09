import { readFile, writeFile, access } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dataDir = resolve(root, "src/data");
const OUTPUT = resolve(dataDir, "appearanceCalibration.json");
const SAMPLES = Math.max(2_000, Number(process.env.APPEARANCE_SAMPLES ?? 50_000));
const QUESTIONS_PER_GAME = 20;
const ANSWERS_SHOWN = 3;
const STAT_KEYS = [
  "intelligence", "creativity", "emotionalControl", "empathy", "social",
  "communication", "ambition", "discipline", "professionalism", "financialSense",
  "risk", "luck", "energy", "humor", "chaos",
];

const load = async (name) => JSON.parse(await readFile(resolve(dataDir, `${name}.json`), "utf8"));
const maybeLoad = async (name, fallback) => {
  const path = resolve(dataDir, `${name}.json`);
  try { await access(path); return JSON.parse(await readFile(path, "utf8")); }
  catch { return fallback; }
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function weightedSampleWithoutReplacement(items, count, weightOf, rng) {
  const pool = [...items];
  const result = [];
  while (result.length < count && pool.length) {
    const weights = pool.map((item) => Math.max(0, Number(weightOf(item) ?? 1)));
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let index = 0;
    if (total <= 0) index = Math.floor(rng() * pool.length);
    else {
      let target = rng() * total;
      for (let i = 0; i < pool.length; i += 1) {
        target -= weights[i];
        if (target <= 0) { index = i; break; }
      }
    }
    result.push(pool[index]);
    pool.splice(index, 1);
  }
  return result;
}

function weightedPick(items, weightOf, rng) {
  return weightedSampleWithoutReplacement(items, 1, weightOf, rng)[0];
}

function applyEffects(stats, effects) {
  for (const [key, delta] of Object.entries(effects ?? {})) {
    stats[key] = Math.max(0, Math.min(100, stats[key] + delta));
  }
}

function distance(stats, profile) {
  const entries = Object.entries(profile ?? {});
  if (!entries.length) return Number.POSITIVE_INFINITY;
  const sum = entries.reduce((acc, [key, target]) => acc + (stats[key] - target) ** 2, 0);
  return Math.sqrt(sum / entries.length);
}

function bestNormalized(stats, entries, baselines, profileKey = "idealProfile") {
  let best = entries[0];
  let bestScore = Number.POSITIVE_INFINITY;
  for (const entry of entries) {
    const d = distance(stats, entry[profileKey]);
    const baseline = baselines?.[entry.id];
    const score = baseline && Number.isFinite(baseline.mean) && Number.isFinite(baseline.std) && baseline.std > 0
      ? (d - baseline.mean) / baseline.std
      : d;
    if (score < bestScore) { best = entry; bestScore = score; }
  }
  return best;
}

function alignmentFor(stats, alignments) {
  const lc = Math.max(-100, Math.min(100, stats.chaos + stats.risk * 0.5 - stats.discipline));
  const ss = Math.max(-100, Math.min(100, stats.ambition - stats.empathy));
  const match = alignments.find((entry) => lc >= entry.lawfulChaotic[0] && lc <= entry.lawfulChaotic[1] && ss >= entry.selflessSelfInterested[0] && ss <= entry.selflessSelfInterested[1]);
  if (match) return match;
  const center = (axis) => (axis[0] + axis[1]) / 2;
  return alignments.reduce((best, entry) => {
    const d = Math.hypot(lc - center(entry.lawfulChaotic), ss - center(entry.selflessSelfInterested));
    const bd = Math.hypot(lc - center(best.lawfulChaotic), ss - center(best.selflessSelfInterested));
    return d < bd ? entry : best;
  });
}

function normalizedCounts(entries, counts) {
  const total = entries.reduce((sum, entry) => sum + (counts.get(entry.id) ?? 1), 0);
  return Object.fromEntries(entries.map((entry) => [entry.id, Number(((counts.get(entry.id) ?? 1) / total).toFixed(8))]));
}

function repairNormalization(group) {
  const keys = Object.keys(group);
  const sum = keys.reduce((acc, key) => acc + group[key], 0);
  if (!keys.length || sum <= 0) return group;
  for (const key of keys) group[key] = group[key] / sum;
  const rounded = Object.fromEntries(keys.map((key) => [key, Number(group[key].toFixed(10))]));
  const roundedSum = keys.reduce((acc, key) => acc + rounded[key], 0);
  rounded[keys[keys.length - 1]] = Number((rounded[keys[keys.length - 1]] + (1 - roundedSum)).toFixed(10));
  return rounded;
}

const [questionsBase, questionsExpansion, questionsExtra, questionsMore, resultsExtra, careersBase, careersExpansion, classesBase, classesExpansion, powersBase, powersExpansion, weaknessesBase, weaknessesExpansion, abilitiesBase, abilitiesExpansion, workStylesBase, workStylesExpansion, animalsBase, animalsExpansion, alignments, baselinesBase, baselinesExtra, baselinesExpansion] = await Promise.all([
  load("questions"), load("questions.expansion"), load("questions.extra"), maybeLoad("questions.more", []), load("results.extra"),
  load("careers"), load("careers.expansion"), load("classes"), load("classes.expansion"), load("powers"), load("powers.expansion"),
  load("weaknesses"), load("weaknesses.expansion"), load("abilities"), load("abilities.expansion"), load("workStyles"), load("workStyles.expansion"),
  load("animals"), load("animals.expansion"), load("alignments"), load("matchBaselines"), load("matchBaselines.extra"), load("matchBaselines.expansion"),
]);

const questions = [...questionsBase, ...questionsExpansion, ...questionsExtra, ...questionsMore];
const groups = {
  careers: [...careersBase, ...(resultsExtra.careers ?? []), ...careersExpansion],
  classes: [...classesBase, ...(resultsExtra.classes ?? []), ...classesExpansion],
  powers: [...powersBase, ...(resultsExtra.powers ?? []), ...powersExpansion],
  weaknesses: [...weaknessesBase, ...(resultsExtra.weaknesses ?? []), ...weaknessesExpansion],
  abilities: [...abilitiesBase, ...(resultsExtra.abilities ?? []), ...abilitiesExpansion],
  workStyles: [...workStylesBase, ...(resultsExtra.workStyles ?? []), ...workStylesExpansion],
  animals: [...animalsBase, ...(resultsExtra.animals ?? []), ...animalsExpansion],
  alignments,
};
const baselines = {};
for (const group of ["careers", "classes", "powers", "weaknesses", "abilities", "workStyles", "animals"]) {
  baselines[group] = { ...(baselinesBase[group] ?? {}), ...(baselinesExtra[group] ?? {}), ...(baselinesExpansion[group] ?? {}) };
}

const counts = Object.fromEntries(Object.entries(groups).map(([name, entries]) => [name, new Map(entries.map((entry) => [entry.id, 1]))]));
const rng = mulberry32(0xF1A1F04D);

for (let run = 0; run < SAMPLES; run += 1) {
  const stats = Object.fromEntries(STAT_KEYS.map((key) => [key, 50]));
  const selectedQuestions = weightedSampleWithoutReplacement(questions, QUESTIONS_PER_GAME, (question) => question.selectionWeight ?? 1, rng);
  for (const question of selectedQuestions) {
    const shown = weightedSampleWithoutReplacement(question.answers, ANSWERS_SHOWN, (answer) => answer.selectionWeight ?? 1, rng);
    const chosen = weightedPick(shown, (answer) => answer.selectionWeight ?? 1, rng);
    if (chosen) applyEffects(stats, chosen.effects);
  }

  const result = {
    careers: bestNormalized(stats, groups.careers, baselines.careers),
    classes: bestNormalized(stats, groups.classes, baselines.classes),
    powers: bestNormalized(stats, groups.powers, baselines.powers),
    weaknesses: bestNormalized(stats, groups.weaknesses, baselines.weaknesses, "lowProfile"),
    abilities: bestNormalized(stats, groups.abilities, baselines.abilities),
    workStyles: bestNormalized(stats, groups.workStyles, baselines.workStyles),
    animals: bestNormalized(stats, groups.animals, baselines.animals),
    alignments: alignmentFor(stats, groups.alignments),
  };
  for (const [group, entry] of Object.entries(result)) counts[group].set(entry.id, (counts[group].get(entry.id) ?? 1) + 1);
}

const calibration = Object.fromEntries(Object.entries(groups).map(([name, entries]) => [name, repairNormalization(normalizedCounts(entries, counts[name]))]));
const text = `${JSON.stringify(calibration, null, 2)}\n`;
await writeFile(OUTPUT, text, "utf8");
console.log(`Appearance calibration OK: ${SAMPLES} simulations, ${questions.length} questions`);
if (process.argv.includes("--print")) console.log(`APPEARANCE_CALIBRATION_JSON=${JSON.stringify(calibration)}`);
