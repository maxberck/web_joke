import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { STAT_INDEX, compileProfile, mulberry32, profileDistanceVector, simulateStatVector } from "./simulateStats.mjs";

const root = resolve(import.meta.dirname, "..");
const dataDir = resolve(root, "src/data");
const QUESTION_FILES = ["work", "social", "life", "personality", "general"];
const RESULT_GROUPS = ["careers", "classes", "powers", "weaknesses", "abilities", "workStyles", "animals"];
const SAMPLES = Math.max(2_000, Number(process.env.APPEARANCE_SAMPLES ?? 200_000));
const OUTPUT = resolve(process.env.APPEARANCE_OUTPUT ?? resolve(dataDir, "appearanceCalibration.json"));
const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const loadData = (name) => readJson(resolve(dataDir, `${name}.json`));
const loadQuestions = (name) => readJson(resolve(dataDir, "questions", `${name}.json`));

const questionParts = await Promise.all(QUESTION_FILES.map(loadQuestions));
const questions = questionParts.flat();
const [baselines, alignments] = await Promise.all([loadData("matchBaselines"), loadData("alignments")]);
const rawGroups = Object.fromEntries(await Promise.all(RESULT_GROUPS.map(async (name) => [name, await loadData(name)])));
const compiledGroups = Object.fromEntries(Object.entries(rawGroups).map(([group, entries]) => [
  group,
  entries.map((entry) => {
    const baseline = baselines[group]?.[entry.id];
    if (!baseline || !Number.isFinite(baseline.mean) || !Number.isFinite(baseline.std) || baseline.std <= 0) {
      throw new Error(`Baseline invalide pour ${group}.${entry.id}`);
    }
    return {
      id: entry.id,
      profile: compileProfile(entry.lowProfile ?? entry.idealProfile),
      mean: baseline.mean,
      invStd: 1 / baseline.std,
    };
  }),
]));
const counts = Object.fromEntries([
  ...Object.entries(rawGroups).map(([g, entries]) => [g, new Map(entries.map((e) => [e.id, 1]))]),
  ["alignments", new Map(alignments.map((e) => [e.id, 1]))],
]);

function bestId(stats, entries) {
  let bestId = entries[0].id;
  let bestScore = Infinity;
  for (const entry of entries) {
    const score = (profileDistanceVector(stats, entry.profile) - entry.mean) * entry.invStd;
    if (score < bestScore) { bestScore = score; bestId = entry.id; }
  }
  return bestId;
}
function alignmentId(stats) {
  const lc = Math.max(-100, Math.min(100, stats[STAT_INDEX.chaos] + stats[STAT_INDEX.risk] * 0.5 - stats[STAT_INDEX.discipline]));
  const ss = Math.max(-100, Math.min(100, stats[STAT_INDEX.ambition] - stats[STAT_INDEX.empathy]));
  for (const a of alignments) {
    if (lc >= a.lawfulChaotic[0] && lc <= a.lawfulChaotic[1] && ss >= a.selflessSelfInterested[0] && ss <= a.selflessSelfInterested[1]) return a.id;
  }
  let best = alignments[0], bestD = Infinity;
  for (const a of alignments) {
    const cx = (a.lawfulChaotic[0] + a.lawfulChaotic[1]) / 2;
    const cy = (a.selflessSelfInterested[0] + a.selflessSelfInterested[1]) / 2;
    const d = (lc-cx)*(lc-cx) + (ss-cy)*(ss-cy);
    if (d < bestD) { bestD = d; best = a; }
  }
  return best.id;
}
function normalize(entries, map) {
  const total = entries.reduce((sum, e) => sum + (map.get(e.id) ?? 1), 0);
  const out = Object.fromEntries(entries.map((e) => [e.id, Number(((map.get(e.id) ?? 1) / total).toFixed(10))]));
  const keys = Object.keys(out);
  const sum = keys.reduce((s,k)=>s+out[k],0);
  out[keys.at(-1)] = Number((out[keys.at(-1)] + (1 - sum)).toFixed(10));
  return out;
}

const rng = mulberry32(0xF1A1F04D);
for (let run = 0; run < SAMPLES; run += 1) {
  const stats = simulateStatVector(questions, rng);
  for (const [group, entries] of Object.entries(compiledGroups)) {
    const id = bestId(stats, entries);
    counts[group].set(id, (counts[group].get(id) ?? 1) + 1);
  }
  const aId = alignmentId(stats);
  counts.alignments.set(aId, (counts.alignments.get(aId) ?? 1) + 1);
}

const calibration = Object.fromEntries(Object.entries(rawGroups).map(([g, entries]) => [g, normalize(entries, counts[g])]));
calibration.alignments = normalize(alignments, counts.alignments);
await writeFile(OUTPUT, `${JSON.stringify(calibration, null, 2)}\n`, "utf8");
console.log(`Appearance calibration V2 OK: ${SAMPLES} simulations, ${questions.length} questions, ${Object.values(rawGroups).reduce((s,a)=>s+a.length,0)} résultats`);
