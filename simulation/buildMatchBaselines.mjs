import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { compileProfile, mulberry32, profileDistanceVector, simulateStatVector } from "./simulateStats.mjs";

const root = resolve(import.meta.dirname, "..");
const dataDir = resolve(root, "src/data");
const QUESTION_FILES = ["work", "social", "life", "personality", "general"];
const GROUPS = ["careers", "classes", "powers", "weaknesses", "abilities", "workStyles", "animals"];
const SAMPLES = Math.max(5_000, Number(process.env.BASELINE_SAMPLES ?? 50_000));
const OUTPUT = resolve(process.env.BASELINE_OUTPUT ?? resolve(dataDir, "matchBaselines.json"));
const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const loadData = (name) => readJson(resolve(dataDir, `${name}.json`));
const loadQuestions = (name) => readJson(resolve(dataDir, "questions", `${name}.json`));

const questionParts = await Promise.all(QUESTION_FILES.map(loadQuestions));
const questions = questionParts.flat();
const rawGroups = Object.fromEntries(await Promise.all(GROUPS.map(async (name) => [name, await loadData(name)])));
const compiled = Object.fromEntries(Object.entries(rawGroups).map(([name, entries]) => [
  name,
  entries.map((entry) => ({ id: entry.id, profile: compileProfile(entry.lowProfile ?? entry.idealProfile), sum: 0, sumSquares: 0 })),
]));

const rng = mulberry32(0xB4511E5);
for (let run = 0; run < SAMPLES; run += 1) {
  const stats = simulateStatVector(questions, rng);
  for (const entries of Object.values(compiled)) {
    for (const entry of entries) {
      const d = profileDistanceVector(stats, entry.profile);
      entry.sum += d;
      entry.sumSquares += d * d;
    }
  }
}

const baselines = {};
for (const [group, entries] of Object.entries(compiled)) {
  baselines[group] = {};
  for (const entry of entries) {
    const mean = entry.sum / SAMPLES;
    const variance = Math.max(1e-12, entry.sumSquares / SAMPLES - mean * mean);
    const std = Math.max(1e-6, Math.sqrt(variance));
    baselines[group][entry.id] = { mean: Number(mean.toFixed(10)), std: Number(std.toFixed(10)) };
  }
}
await writeFile(OUTPUT, `${JSON.stringify(baselines, null, 2)}\n`, "utf8");
console.log(`Match baselines OK: ${SAMPLES} simulations, ${questions.length} questions, ${Object.values(rawGroups).reduce((s,a)=>s+a.length,0)} résultats`);
