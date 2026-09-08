import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeFinalForm } from "../src/engine/computeFinalForm.ts";
import { selectQuestions, selectAnswers } from "../src/engine/selection/index.ts";
import { contentPack, matchBaselines } from "../src/data/index.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUNS = Number(process.argv[2] ?? 100000);
const QUESTIONS_PER_GAME = 20;
const ANSWERS_SHOWN = 3;

/**
 * Percentiles qui définissent les paliers de rareté affichés à l'utilisateur.
 * oneInX = 100 / (100 - percentile) : un profil au P99 est "1 sur 100", au P99.99 "1 sur 10000", etc.
 */
const PERCENTILE_BREAKPOINTS = [0, 50, 75, 90, 95, 99, 99.9, 99.99];

function main() {
  console.log(`Génération de la distribution de rareté sur ${RUNS} profils simulés...`);

  const scores: number[] = [];
  for (let i = 0; i < RUNS; i++) {
    const questions = selectQuestions(contentPack.questions, {
      count: Math.min(QUESTIONS_PER_GAME, contentPack.questions.length),
    });
    const chosenAnswerEffects = questions.map((q) => {
      const shown = selectAnswers(q.answers, { count: ANSWERS_SHOWN });
      return shown[Math.floor(Math.random() * shown.length)]!.effects;
    });
    const result = computeFinalForm({ chosenAnswerEffects, content: contentPack, matchBaselines });
    scores.push(result.rarity.score);
  }

  scores.sort((a, b) => a - b);

  const table = PERCENTILE_BREAKPOINTS.map((p) => {
    const index = Math.min(Math.floor((p / 100) * (scores.length - 1)), scores.length - 1);
    const oneInX = p === 0 ? 1 : Math.round(100 / (100 - p));
    return { minScore: scores[index]!, oneInX };
  });

  // Dédupliquer les paliers avec le même minScore (arrive si peu de règles distinctes matchent).
  const dedupedTable = table.filter(
    (bucket, i) => i === 0 || bucket.minScore !== table[i - 1]!.minScore
  );

  const outputPath = path.join(__dirname, "..", "src", "data", "rarityDistribution.json");
  writeFileSync(outputPath, JSON.stringify(dedupedTable, null, 2) + "\n", "utf-8");

  console.log("Table générée :", dedupedTable);
  console.log(`Écrit dans ${outputPath}`);
  console.log(
    "\nTable régénérée avec le score de rareté continu (extremity + synergies, voir " +
      "engine/synergy/computeExtremityScore.ts). À relancer après tout changement significatif " +
      "du contenu (nouvelles questions, nouvelles règles de synergie, etc.)."
  );
}

main();
