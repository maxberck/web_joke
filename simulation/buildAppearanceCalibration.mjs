import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { selectAnswers, selectQuestions } from "../src/engine/selection/index.ts";

const root = resolve(import.meta.dirname, "..");
const dataDir = resolve(root, "src/data");
const OUTPUT = resolve(process.env.APPEARANCE_OUTPUT ?? resolve(dataDir, "appearanceCalibration.json"));
const SAMPLES = Math.max(2_000, Number(process.env.APPEARANCE_SAMPLES ?? 200_000));
const QUESTIONS_PER_GAME = 20;
const ANSWERS_SHOWN = 3;
const QUESTION_FILES = ["work", "social", "life", "personality", "general"];
const STAT_KEYS = [
  "intelligence", "creativity", "emotionalControl", "empathy", "social",
  "communication", "ambition", "discipline", "professionalism", "financialSense",
  "risk", "luck", "energy", "humor", "chaos",
];

const loadData = async (name) => JSON.parse(await readFile(resolve(dataDir, `${name}.json`), "utf8"));
const loadQuestions = async (name) => JSON.parse(await readFile(resolve(dataDir, "questions", `${name}.json`), "utf8"));

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
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
    if (total <= 0) {
      index = Math.floor(rng() * pool.length);
    } else {
      let target = rng() * total;
      for (let i = 0; i < pool.length; i += 1) {
        target -= weights[i];
        if (target <= 0) {
          index = i;
          break;
        }
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
    if (score < bestScore) {
      best = entry;
      bestScore = score;
    }
  }
  return best;
}

function alignmentFor(stats, alignments) {
  const lc = Math.max(-100, Math.min(100, stats.chaos + stats.risk * 0.5 - stats.discipline));
  const ss = Math.max(-100, Math.min(100, stats.ambition - stats.empathy));
  const match = alignments.find(
    (entry) => lc >= entry.lawfulChaotic[0]
      && lc <= entry.lawfulChaotic[1]
      && ss >= entry.selflessSelfInterested[0]
      && ss <= entry.selflessSelfInterested[1],
  );
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
  return Object.fromEntries(
    entries.map((entry) => [entry.id, Number(((counts.get(entry.id) ?? 1) / total).toFixed(8))]),
  );
}

function repairNormalization(group) {
  const keys = Object.keys(group);
  const sum = keys.reduce((acc, key) => acc + group[key], 0);
  if (!keys.length || sum <= 0) return group;
  for (const key of keys) group[key] /= sum;
  const rounded = Object.fromEntries(keys.map((key) => [key, Number(group[key].toFixed(10))]));
  const roundedSum = keys.reduce((acc, key) => acc + rounded[key], 0);
  rounded[keys[keys.length - 1]] = Number(
    (rounded[keys[keys.length - 1]] + (1 - roundedSum)).toFixed(10),
  );
  return rounded;
}

const [questionParts, careers, classes, powers, weaknesses, abilities, workStyles, animals, alignments, baselines] = await Promise.all([
  Promise.all(QUESTION_FILES.map(loadQuestions)),
  loadData("careers"),
  loadData("classes"),
  loadData("powers"),
  loadData("weaknesses"),
  loadData("abilities"),
  loadData("workStyles"),
  loadData("animals"),
  loadData("alignments"),
  loadData("matchBaselines"),
]);

const questions = questionParts.flat();
const groups = { careers, classes, powers, weaknesses, abilities, workStyles, animals, alignments };
const counts = Object.fromEntries(
  Object.entries(groups).map(([name, entries]) => [name, new Map(entries.map((entry) => [entry.id, 1]))]),
);
const rng = mulberry32(0xF1A1F04D);

for (let run = 0; run < SAMPLES; run += 1) {
  const stats = Object.fromEntries(STAT_KEYS.map((key) => [key, 50]));
  const selectedQuestions = selectQuestions(questions, { count: QUESTIONS_PER_GAME, rng });

  for (const question of selectedQuestions) {
    const shown = selectAnswers(question.answers, { count: ANSWERS_SHOWN, rng });
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

  for (const [group, entry] of Object.entries(result)) {
    counts[group].set(entry.id, (counts[group].get(entry.id) ?? 1) + 1);
  }
}

const calibration = Object.fromEntries(
  Object.entries(groups).map(([name, entries]) => [name, repairNormalization(normalizedCounts(entries, counts[name]))]),
);

await writeFile(OUTPUT, `${JSON.stringify(calibration, null, 2)}\n`, "utf8");
console.log(`Appearance calibration OK: ${SAMPLES} simulations, ${questions.length} questions`);
if (process.env.PRINT_APPEARANCE_JSON === "1" || process.argv.includes("--print")) {
  console.log(`APPEARANCE_CALIBRATION_JSON=${JSON.stringify(calibration)}`);
}
