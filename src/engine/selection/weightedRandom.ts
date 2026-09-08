/**
 * Tire `count` éléments distincts parmi `items`, sans remise, en respectant
 * les poids fournis par `getWeight`. Poids par défaut = 1 si non fourni.
 */
export function weightedSampleWithoutReplacement<T>(
  items: T[],
  count: number,
  getWeight: (item: T) => number,
  rng: () => number = Math.random
): T[] {
  const pool = items.map((item) => ({ item, weight: Math.max(getWeight(item), 0.0001) }));
  const picked: T[] = [];

  while (picked.length < count && pool.length > 0) {
    const totalWeight = pool.reduce((sum, entry) => sum + entry.weight, 0);
    let threshold = rng() * totalWeight;

    let index = 0;
    for (; index < pool.length; index++) {
      threshold -= pool[index]!.weight;
      if (threshold <= 0) break;
    }
    const chosenIndex = Math.min(index, pool.length - 1);

    picked.push(pool[chosenIndex]!.item);
    pool.splice(chosenIndex, 1);
  }

  return picked;
}
