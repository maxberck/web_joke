export const STAT_KEYS = [
  "intelligence", "creativity", "emotionalControl", "empathy", "social",
  "communication", "ambition", "discipline", "professionalism", "financialSense",
  "risk", "luck", "energy", "humor", "chaos",
] as const;

export type StatKey = (typeof STAT_KEYS)[number];
export type Stats = Record<StatKey, number>;
export type StatEffects = Partial<Record<StatKey, number>>;

export type Locale = "en" | "fr" | "es";
export type LocalizedText = Record<Locale, string>;

export interface Answer {
  id: string;
  text: LocalizedText;
  effects: StatEffects;
  selectionWeight?: number;
}

export interface Question {
  id: string;
  category: string;
  selectionWeight?: number;
  text: LocalizedText;
  answers: Answer[];
}

export interface ProfileEntity {
  id: string;
  name: LocalizedText;
  description?: LocalizedText;
  idealProfile: Partial<Stats>;
  worthPotential?: { min: number; max: number };
  tags?: string[];
}

export interface Alignment extends Omit<ProfileEntity, "idealProfile"> {
  lawfulChaotic: [number, number];
  selflessSelfInterested: [number, number];
}

export interface SynergyCondition {
  stat: StatKey;
  op: ">" | ">=" | "<" | "<=" | "==";
  value: number;
}

export interface SynergyRule {
  id: string;
  conditions: SynergyCondition[];
  weight: number;
  rarityScore: number;
  tags: string[];
}

export interface ContentPack {
  questions: Question[];
  careers: ProfileEntity[];
  animals: ProfileEntity[];
  classes: ProfileEntity[];
  powers: ProfileEntity[];
  weaknesses: ProfileEntity[];
  abilities: ProfileEntity[];
  workStyles: ProfileEntity[];
  alignments: Alignment[];
  synergyRules: SynergyRule[];
}

export interface MatchBaselineEntry {
  mean: number;
  std: number;
}
export type MatchBaselines = Record<string, Record<string, MatchBaselineEntry>>;

export interface DerivedStats {
  [key: string]: number;
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
  threatLevel: number;
  lifeExpectancyYears: number;
  worth: number;
  rarity: { score: number; oneInX: number };
  runSeed?: number;
  formId?: string;
}

export function createNeutralStats(): Stats {
  return Object.fromEntries(STAT_KEYS.map((key) => [key, 50])) as Stats;
}
