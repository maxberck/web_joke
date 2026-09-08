import type { Stats, DerivedStats } from "@final-form/shared-types";
import { computeCompetence } from "./competence.ts";
import { computeSocialIntelligence } from "./socialIntelligence.ts";
import { computeReliability } from "./reliability.ts";
import { computeDrive } from "./drive.ts";
import { computeFinancialAbility } from "./financialAbility.ts";
import { computeImprovisation } from "./improvisation.ts";
import { computeDangerProfile } from "./dangerProfile.ts";

export function computeDerivedStats(stats: Stats): DerivedStats {
  return {
    competence: computeCompetence(stats),
    socialIntelligence: computeSocialIntelligence(stats),
    reliability: computeReliability(stats),
    drive: computeDrive(stats),
    financialAbility: computeFinancialAbility(stats),
    improvisation: computeImprovisation(stats),
    dangerProfile: computeDangerProfile(stats),
  };
}

export {
  computeCompetence,
  computeSocialIntelligence,
  computeReliability,
  computeDrive,
  computeFinancialAbility,
  computeImprovisation,
  computeDangerProfile,
};
