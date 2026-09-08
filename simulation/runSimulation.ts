import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeFinalForm } from "../src/engine/computeFinalForm.ts";
import { selectQuestions, selectAnswers } from "../src/engine/selection/index.ts";
import { contentPack, matchBaselines } from "../src/data/index.ts";
import type { FinalForm } from "@final-form/shared-types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUNS = Number(process.argv[2] ?? 20000);
const QUESTIONS_PER_GAME = 20;
const ANSWERS_SHOWN = 3;

function simulateOneProfile(): FinalForm {
  const questions = selectQuestions(contentPack.questions, {
    count: Math.min(QUESTIONS_PER_GAME, contentPack.questions.length),
  });
  const chosenAnswerEffects = questions.map((q) => {
    const shown = selectAnswers(q.answers, { count: ANSWERS_SHOWN });
    return shown[Math.floor(Math.random() * shown.length)]!.effects;
  });
  return computeFinalForm({ chosenAnswerEffects, content: contentPack, matchBaselines });
}

function main() {
  console.log(`Simulation de ${RUNS} profils...`);

  const results: FinalForm[] = [];
  for (let i = 0; i < RUNS; i++) {
    results.push(simulateOneProfile());
  }

  const careerFreq = new Map<string, number>();
  const classFreq = new Map<string, number>();
  const animalFreq = new Map<string, number>();
  const rarityScores: number[] = [];
  let debtCount = 0;
  let millionaireCount = 0;
  let billionaireCount = 0;

  for (const r of results) {
    careerFreq.set(r.careerId, (careerFreq.get(r.careerId) ?? 0) + 1);
    classFreq.set(r.classId, (classFreq.get(r.classId) ?? 0) + 1);
    animalFreq.set(r.animalId, (animalFreq.get(r.animalId) ?? 0) + 1);
    rarityScores.push(r.rarity.score);
    if (r.worth < 0) debtCount++;
    if (r.worth >= 1_000_000) millionaireCount++;
    if (r.worth >= 1_000_000_000) billionaireCount++;
  }

  const report = {
    runs: RUNS,
    generatedAt: new Date().toISOString(),
    careerFrequency: Object.fromEntries(
      [...careerFreq.entries()].map(([id, n]) => [id, `${((n / RUNS) * 100).toFixed(2)}%`])
    ),
    classFrequency: Object.fromEntries(
      [...classFreq.entries()].map(([id, n]) => [id, `${((n / RUNS) * 100).toFixed(2)}%`])
    ),
    animalFrequency: Object.fromEntries(
      [...animalFreq.entries()].map(([id, n]) => [id, `${((n / RUNS) * 100).toFixed(2)}%`])
    ),
    worth: {
      debtPercent: `${((debtCount / RUNS) * 100).toFixed(2)}%`,
      millionairePercent: `${((millionaireCount / RUNS) * 100).toFixed(4)}%`,
      billionairePercent: `${((billionaireCount / RUNS) * 100).toFixed(6)}%`,
    },
    rarityScoreDistribution: summarizeDistribution(rarityScores),
  };

  const reportPath = path.join(__dirname, "reports", `simulation-${Date.now()}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");

  console.log(JSON.stringify(report, null, 2));
  console.log(`\nRapport écrit : ${reportPath}`);
}

function summarizeDistribution(scores: number[]) {
  const sorted = [...scores].sort((a, b) => a - b);
  const percentile = (p: number) => sorted[Math.floor((p / 100) * (sorted.length - 1))];
  return {
    min: sorted[0],
    p50: percentile(50),
    p90: percentile(90),
    p99: percentile(99),
    max: sorted[sorted.length - 1],
  };
}

main();
