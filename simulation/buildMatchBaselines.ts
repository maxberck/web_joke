import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { selectQuestions, selectAnswers } from "../src/engine/selection/index.ts";
import { applyAnswerEffects } from "../src/engine/scoring/index.ts";
import { profileDistance } from "../src/engine/result/profileMatch.ts";
import { contentPack } from "../src/data/index.ts";
import { createNeutralStats, type Stats, type IdealProfile } from "@final-form/shared-types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUNS = Number(process.argv[2] ?? 50000);
const QUESTIONS_PER_GAME = 20;
const ANSWERS_SHOWN = 3;

function simulateOneStatsProfile(): Stats {
  const questions = selectQuestions(contentPack.questions, {
    count: Math.min(QUESTIONS_PER_GAME, contentPack.questions.length),
  });
  return questions.reduce<Stats>((stats, q) => {
    const shown = selectAnswers(q.answers, { count: ANSWERS_SHOWN });
    const picked = shown[Math.floor(Math.random() * shown.length)]!;
    return applyAnswerEffects(stats, picked.effects);
  }, createNeutralStats());
}

interface Baseline {
  mean: number;
  std: number;
}

function computeBaselines(
  profiles: Stats[],
  entries: { id: string; profile: IdealProfile }[]
): Record<string, Baseline> {
  const result: Record<string, Baseline> = {};

  for (const entry of entries) {
    const distances = profiles.map((stats) => profileDistance(stats, entry.profile));
    const mean = distances.reduce((a, b) => a + b, 0) / distances.length;
    const variance = distances.reduce((a, d) => a + (d - mean) ** 2, 0) / distances.length;
    const std = Math.sqrt(variance);
    // std=0 (contenu trivial) fallback à 1 pour éviter une division par zéro dans le z-score.
    result[entry.id] = { mean, std: std || 1 };
  }

  return result;
}

function main() {
  console.log(`Génération de ${RUNS} profils réels (via le vrai moteur de sélection) pour calculer les baselines...`);

  const profiles: Stats[] = [];
  for (let i = 0; i < RUNS; i++) profiles.push(simulateOneStatsProfile());

  const baselines = {
    careers: computeBaselines(
      profiles,
      contentPack.careers.map((c) => ({ id: c.id, profile: c.idealProfile }))
    ),
    classes: computeBaselines(
      profiles,
      contentPack.classes.map((c) => ({ id: c.id, profile: c.idealProfile }))
    ),
    animals: computeBaselines(
      profiles,
      contentPack.animals.map((a) => ({ id: a.id, profile: a.idealProfile }))
    ),
    powers: computeBaselines(
      profiles,
      contentPack.powers.map((p) => ({ id: p.id, profile: p.idealProfile }))
    ),
    abilities: computeBaselines(
      profiles,
      contentPack.abilities.map((a) => ({ id: a.id, profile: a.idealProfile }))
    ),
    workStyles: computeBaselines(
      profiles,
      contentPack.workStyles.map((w) => ({ id: w.id, profile: w.idealProfile }))
    ),
    weaknesses: computeBaselines(
      profiles,
      contentPack.weaknesses.map((w) => ({ id: w.id, profile: w.lowProfile }))
    ),
  };

  const outputPath = path.join(__dirname, "..", "src", "data", "matchBaselines.json");
  writeFileSync(outputPath, JSON.stringify(baselines, null, 2) + "\n", "utf-8");

  console.log(`Baselines écrites dans ${outputPath}`);
  console.log(
    "\nExemple (careers) :",
    JSON.stringify(Object.fromEntries(Object.entries(baselines.careers).slice(0, 3)), null, 2)
  );
}

main();
