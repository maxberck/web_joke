import { selectAnswers, selectQuestions } from "../src/engine/selection/index.ts";

export const STAT_KEYS = [
  "intelligence", "creativity", "emotionalControl", "empathy", "social",
  "communication", "ambition", "discipline", "professionalism", "financialSense",
  "risk", "luck", "energy", "humor", "chaos",
];
export const STAT_INDEX = Object.fromEntries(STAT_KEYS.map((key, index) => [key, index]));
export const QUESTIONS_PER_GAME = 20;
export const ANSWERS_SHOWN = 3;

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function weightedPick(items, rng) {
  let total = 0;
  for (const item of items) total += Math.max(0, Number(item.selectionWeight ?? 1));
  if (total <= 0) return items[Math.floor(rng() * items.length)];
  let target = rng() * total;
  for (const item of items) {
    target -= Math.max(0, Number(item.selectionWeight ?? 1));
    if (target <= 0) return item;
  }
  return items.at(-1);
}

export function simulateStatVector(questions, rng) {
  const stats = new Float64Array(STAT_KEYS.length);
  stats.fill(50);
  const selectedQuestions = selectQuestions(questions, { count: QUESTIONS_PER_GAME, rng });
  for (const question of selectedQuestions) {
    const shown = selectAnswers(question.answers, { count: ANSWERS_SHOWN, rng });
    const chosen = weightedPick(shown, rng);
    if (!chosen) continue;
    for (const [key, delta] of Object.entries(chosen.effects ?? {})) {
      const index = STAT_INDEX[key];
      if (index === undefined) continue;
      stats[index] = Math.max(0, Math.min(100, stats[index] + delta));
    }
  }
  return stats;
}

export function compileProfile(profile) {
  const indexes = [];
  const targets = [];
  for (const [key, value] of Object.entries(profile ?? {})) {
    const index = STAT_INDEX[key];
    if (index === undefined || !Number.isFinite(value)) continue;
    indexes.push(index);
    targets.push(value);
  }
  if (indexes.length === 0) throw new Error("Profil vide pendant la compilation de simulation");
  return { indexes, targets, count: indexes.length };
}

export function profileDistanceVector(stats, compiled) {
  let sumSquares = 0;
  for (let i = 0; i < compiled.count; i += 1) {
    const diff = stats[compiled.indexes[i]] - compiled.targets[i];
    sumSquares += diff * diff;
  }
  return Math.sqrt(sumSquares / compiled.count);
}
