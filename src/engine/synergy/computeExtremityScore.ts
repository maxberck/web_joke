import { STAT_KEYS, type Stats } from "@final-form/shared-types";

/**
 * Score continu de "singularité statistique" : à quel point le profil s'écarte
 * globalement de la neutralité (50) sur l'ensemble des 15 stats, indépendamment
 * de toute règle de synergie nommée.
 *
 * Pourquoi c'est nécessaire : sans ça, le score de rareté ne dépend QUE des
 * règles de synergie déclenchées (voir synergyRules.json), qui exigent souvent
 * plusieurs conditions extrêmes simultanées et ne se déclenchent quasiment
 * jamais — la quasi-totalité des profils se retrouve alors avec un score de 0
 * et donc le même palier de rareté ("stagne à un niveau"). Ce score continu
 * garantit une variation lisse pour TOUS les profils, les règles de synergie
 * ajoutant ensuite des bonus ponctuels par-dessus pour les combinaisons
 * vraiment remarquables.
 */
export function computeExtremityScore(stats: Stats): number {
  const sumSquaredDeviation = STAT_KEYS.reduce((acc, key) => {
    const deviation = Math.abs(stats[key] - 50) / 50; // 0 (neutre) .. 1 (extrême)
    return acc + deviation * deviation;
  }, 0);

  // Mise à l'échelle pour rester comparable aux rarityScore des règles de synergie (6-28).
  return sumSquaredDeviation * 2;
}
