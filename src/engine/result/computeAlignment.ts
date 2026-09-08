import type { Stats, AlignmentEntry } from "@final-form/shared-types";

/** Axe Lawful (-100) ↔ Chaotic (+100), dérivé de discipline vs chaos/risk. */
function lawfulChaoticAxis(stats: Stats): number {
  const raw = stats.chaos + stats.risk * 0.5 - stats.discipline;
  return Math.max(-100, Math.min(100, raw));
}

/** Axe Selfless (-100) ↔ Self-Interested (+100), dérivé d'empathy vs ambition. */
function selflessSelfInterestedAxis(stats: Stats): number {
  const raw = stats.ambition - stats.empathy;
  return Math.max(-100, Math.min(100, raw));
}

export function computeAlignment(stats: Stats, alignments: AlignmentEntry[]): AlignmentEntry {
  const lc = lawfulChaoticAxis(stats);
  const ss = selflessSelfInterestedAxis(stats);

  const match = alignments.find(
    (entry) =>
      lc >= entry.lawfulChaotic[0] &&
      lc <= entry.lawfulChaotic[1] &&
      ss >= entry.selflessSelfInterested[0] &&
      ss <= entry.selflessSelfInterested[1]
  );

  if (match) return match;

  // Filet de sécurité si aucune plage ne couvre exactement le point (mauvais paramétrage
  // du contenu) : on prend l'entrée dont le centre de plage est le plus proche.
  return alignments.reduce((best, entry) => {
    const center = (axis: [number, number]) => (axis[0] + axis[1]) / 2;
    const dist = Math.hypot(lc - center(entry.lawfulChaotic), ss - center(entry.selflessSelfInterested));
    const bestDist = Math.hypot(lc - center(best.lawfulChaotic), ss - center(best.selflessSelfInterested));
    return dist < bestDist ? entry : best;
  });
}
