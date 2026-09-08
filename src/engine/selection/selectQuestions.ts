import type { Question } from "@final-form/shared-types";
import { weightedSampleWithoutReplacement } from "./weightedRandom.ts";

export interface SelectQuestionsOptions {
  count: number;
  /** Nombre max de questions autorisées pour une même catégorie (évite le déséquilibre, section 5). */
  maxPerCategory?: number;
  rng?: () => number;
}

export function selectQuestions(pool: Question[], options: SelectQuestionsOptions): Question[] {
  const { count, maxPerCategory = Math.ceil(count / 3), rng = Math.random } = options;

  const categoryCounts = new Map<string, number>();
  const selected: Question[] = [];
  let remaining = [...pool];

  while (selected.length < count && remaining.length > 0) {
    const [picked] = weightedSampleWithoutReplacement(
      remaining,
      1,
      (q) => q.selectionWeight ?? 1,
      rng
    );
    if (!picked) break;

    remaining = remaining.filter((q) => q.id !== picked.id);

    const currentCount = categoryCounts.get(picked.category) ?? 0;
    if (currentCount >= maxPerCategory) continue; // on saute cette question, on retente au tour suivant

    categoryCounts.set(picked.category, currentCount + 1);
    selected.push(picked);
  }

  return selected;
}
