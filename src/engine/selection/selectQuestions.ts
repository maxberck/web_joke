import type { Question } from "@final-form/shared-types";
import { weightedSampleWithoutReplacement } from "./weightedRandom.ts";

export interface SelectQuestionsOptions {
  count: number;
  maxPerCategory?: number;
  rng?: () => number;
}

export function selectQuestions(pool: Question[], options: SelectQuestionsOptions): Question[] {
  const { count, maxPerCategory = Math.ceil(count / 3), rng = Math.random } = options;
  if (count <= 0 || pool.length === 0) return [];
  if (pool.length < count) {
    throw new Error(`Question pool too small: requested ${count}, available ${pool.length}`);
  }

  const selected: Question[] = [];
  const categoryCounts = new Map<string, number>();
  let remaining = [...pool];

  while (selected.length < count && remaining.length > 0) {
    const eligible = remaining.filter(
      (question) => (categoryCounts.get(question.category) ?? 0) < maxPerCategory
    );

    if (eligible.length === 0) break;

    const [picked] = weightedSampleWithoutReplacement(
      eligible,
      1,
      (question) => Math.max(0, question.selectionWeight ?? 1),
      rng,
    );
    if (!picked) break;

    selected.push(picked);
    categoryCounts.set(picked.category, (categoryCounts.get(picked.category) ?? 0) + 1);
    remaining = remaining.filter((question) => question.id !== picked.id);
  }

  // The balancing cap is a preference, not permission to return a broken game.
  // A second pass fills remaining slots from all unused questions.
  if (selected.length < count) {
    const selectedIds = new Set(selected.map((question) => question.id));
    const fallback = pool.filter((question) => !selectedIds.has(question.id));
    const needed = count - selected.length;
    const extra = weightedSampleWithoutReplacement(
      fallback,
      needed,
      (question) => Math.max(0, question.selectionWeight ?? 1),
      rng,
    );
    selected.push(...extra);
  }

  if (selected.length !== count) {
    throw new Error(`Unable to select ${count} questions; selected ${selected.length}`);
  }

  return selected;
}
