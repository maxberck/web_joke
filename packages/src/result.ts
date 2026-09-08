import type { Stats } from "./stats.ts";

export interface DerivedStats {
  competence: number;
  socialIntelligence: number;
  reliability: number;
  drive: number;
  financialAbility: number;
  improvisation: number;
  dangerProfile: number;
}

export interface FinalForm {
  coreStats: Stats;
  derivedStats: DerivedStats;
  matchedRuleTags: string[];
  classId: string;
  careerId: string;
  powerId: string;
  weaknessId: string;
  abilityId: string;
  workStyleId: string;
  animalId: string;
  alignmentId: string;
  auraPercent: number;
  threatLevel: number; // 0–10
  lifeExpectancyYears: number;
  worth: number; // peut être négatif
  rarity: {
    score: number;
    oneInX: number;
  };
}
