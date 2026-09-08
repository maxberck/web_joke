/**
 * Les 15 statistiques fondamentales du moteur (section 2 du concept).
 * C'est la SEULE liste à modifier si un jour une stat est ajoutée/retirée :
 * tout le reste du moteur est générique et boucle sur ces clés.
 */
export const STAT_KEYS = [
  "intelligence",
  "humor",
  "discipline",
  "luck",
  "social",
  "emotionalControl",
  "creativity",
  "ambition",
  "energy",
  "professionalism",
  "communication",
  "financialSense",
  "chaos",
  "risk",
  "empathy",
] as const;

export type StatKey = (typeof STAT_KEYS)[number];

/** Valeurs des 15 stats, toutes présentes (record complet, pas de champs optionnels). */
export type Stats = Record<StatKey, number>;

/** Effet partiel appliqué par une réponse : seules les stats touchées sont listées. */
export type StatEffects = Partial<Record<StatKey, number>>;

export const STAT_RANGE = { min: 0, max: 100 } as const;
export const STAT_NEUTRAL_START = 50;

export function createNeutralStats(): Stats {
  return STAT_KEYS.reduce((acc, key) => {
    acc[key] = STAT_NEUTRAL_START;
    return acc;
  }, {} as Stats);
}
