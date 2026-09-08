import type { Answer, StatEffects } from "@final-form/shared-types";

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
 * Choisit `count` réponses parmi le pool de 10 en maximisant la diversité de leurs
 * effets statistiques, pour garantir un vrai dilemme (section 4) plutôt que trois
 * réponses qui orientent quasiment vers le même profil.
 */
export function selectAnswers(answers: Answer[], options: SelectAnswersOptions): Answer[] {
  const { count, rng = Math.random } = options;
  if (answers.length <= count) return [...answers];

  const remaining = [...answers];

  // Première réponse : tirage pondéré simple pour garder une part d'aléatoire.
  const firstIndex = Math.floor(rng() * remaining.length);
  const selected: Answer[] = [remaining.splice(firstIndex, 1)[0]!];

  // Réponses suivantes : on prend celle qui maximise la distance minimale
  // aux réponses déjà choisies (farthest-point sampling).
  while (selected.length < count && remaining.length > 0) {
    let bestIndex = 0;
    let bestScore = -Infinity;

    remaining.forEach((candidate, index) => {
      const minDistance = Math.min(
        ...selected.map((chosen) => effectDistance(chosen.effects, candidate.effects))
      );
      if (minDistance > bestScore) {
        bestScore = minDistance;
        bestIndex = index;
      }
    });

    selected.push(remaining.splice(bestIndex, 1)[0]!);
  }

  return selected;
}
