import type { Question } from "@final-form/shared-types";
import { weightedSampleWithoutReplacement } from "./weightedRandom.ts";

export interface SelectQuestionsOptions {
  count: number;
  maxPerCategory?: number;
  rng?: () => number;
}

/**
 * Sélectionne exactement `count` questions si le pool est suffisamment grand.
 * Le cap de catégorie est appliqué en priorité, puis un backfill garantit que
 * la préférence de répartition ne peut jamais casser la taille de la partie.
 */
export function selectQuestions(pool: Question[], options: SelectQuestionsOptions): Question[] {
  const { count, maxPerCategory = Math.ceil(count / 3), rng = Math.random } = options;

  if (!Number.isInteger(count) || count < 0) {
    throw new Error(`Invalid question count: ${count}.`);
  }
  if (pool.length < count) {
    throw new Error(`Not enough questions: requested ${count}, available ${pool.length}.`);
  }
  if (count === 0) return [];

  const uniquePool = [...new Map(pool.map((question) => [question.id, question])).values()];
  if (uniquePool.length < count) {
    throw new Error(`Not enough unique questions: requested ${count}, available ${uniquePool.length}.`);
  }

  const categoryCounts = new Map<string, number>();
  const selected: Question[] = [];
  let remaining = [...uniquePool];

  while (selected.length < count && remaining.length > 0) {
    const eligible = remaining.filter(
      (question) => (categoryCounts.get(question.category) ?? 0) < maxPerCategory
    );
    if (eligible.length === 0) break;

    const [picked] = weightedSampleWithoutReplacement(
      eligible,
      1,
      (question) => question.selectionWeight ?? 1,
      rng
    );
    if (!picked) break;

    selected.push(picked);
    categoryCounts.set(picked.category, (categoryCounts.get(picked.category) ?? 0) + 1);
    remaining = remaining.filter((question) => question.id !== picked.id);
  }

  while (selected.length < count && remaining.length > 0) {
    const [picked] = weightedSampleWithoutReplacement(
      remaining,
      1,
      (question) => question.selectionWeight ?? 1,
      rng
    );
    if (!picked) break;
    selected.push(picked);
    remaining = remaining.filter((question) => question.id !== picked.id);
  }

  if (selected.length !== count) {
    throw new Error(`Unable to select ${count} unique questions; selected ${selected.length}.`);
  }

  return selected;
}
