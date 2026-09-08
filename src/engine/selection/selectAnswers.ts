import type { Answer, StatEffects } from "@final-form/shared-types";
import { weightedSampleWithoutReplacement } from "./weightedRandom.ts";

function effectDistance(a: StatEffects, b: StatEffects): number {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let sumSquares = 0;
  for (const key of keys) {
    const diff = (a[key as keyof StatEffects] ?? 0) - (b[key as keyof StatEffects] ?? 0);
    sumSquares += diff * diff;
  }
  return Math.sqrt(sumSquares);
}

export interface SelectAnswersOptions {
  count: number;
  rng?: () => number;
  diversityWeight?: number;
}

export function selectAnswers(answers: Answer[], options: SelectAnswersOptions): Answer[] {
  const { count, rng = Math.random, diversityWeight = 0.65 } = options;
  if (count <= 0) return [];
  if (answers.length <= count) return [...answers];

  const selected: Answer[] = [];
  let remaining = [...answers];

  const [first] = weightedSampleWithoutReplacement(
    remaining,
    1,
    (answer) => Math.max(0, answer.selectionWeight ?? 1),
    rng,
  );
  if (!first) return [];
  selected.push(first);
  remaining = remaining.filter((answer) => answer.id !== first.id);

  while (selected.length < count && remaining.length > 0) {
    let bestIndex = 0;
    let bestScore = -Infinity;

    remaining.forEach((candidate, index) => {
      const minDistance = Math.min(
        ...selected.map((chosen) => effectDistance(chosen.effects, candidate.effects)),
      );
      const weight = Math.max(0, candidate.selectionWeight ?? 1);
      const weightScore = weight / Math.max(1, ...remaining.map((answer) => answer.selectionWeight ?? 1));
      const score = diversityWeight * minDistance + (1 - diversityWeight) * weightScore * 10;

      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    selected.push(remaining.splice(bestIndex, 1)[0]!);
  }

  return selected;
}
