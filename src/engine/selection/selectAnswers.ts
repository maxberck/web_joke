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
}

/**
 * Sélectionne des réponses en combinant deux objectifs :
 * 1. `selectionWeight` reste une préférence éditoriale ;
 * 2. les effets statistiques restent suffisamment différents pour créer un dilemme.
 */
export function selectAnswers(answers: Answer[], options: SelectAnswersOptions): Answer[] {
  const { count, rng = Math.random } = options;
  if (!Number.isInteger(count) || count < 0) throw new Error(`Invalid answer count: ${count}.`);
  if (answers.length < count) {
    throw new Error(`Not enough answers: requested ${count}, available ${answers.length}.`);
  }
  if (answers.length === count) return [...answers];
  if (count === 0) return [];

  const remaining = [...new Map(answers.map((answer) => [answer.id, answer])).values()];
  if (remaining.length < count) throw new Error(`Not enough unique answers for selection.`);

  const [first] = weightedSampleWithoutReplacement(
    remaining,
    1,
    (answer) => answer.selectionWeight ?? 1,
    rng
  );
  if (!first) throw new Error("Unable to select the first answer.");

  const selected: Answer[] = [first];
  remaining.splice(remaining.findIndex((answer) => answer.id === first.id), 1);

  while (selected.length < count && remaining.length > 0) {
    let bestIndex = 0;
    let bestScore = -Infinity;

    remaining.forEach((candidate, index) => {
      const minDistance = Math.min(
        ...selected.map((chosen) => effectDistance(chosen.effects, candidate.effects))
      );
      const weight = Math.max(candidate.selectionWeight ?? 1, 0.0001);
      // Logarithme : le poids influence le choix sans écraser la diversité statistique.
      const score = minDistance + Math.log(weight) * 2;
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    selected.push(remaining.splice(bestIndex, 1)[0]!);
  }

  return selected;
}
