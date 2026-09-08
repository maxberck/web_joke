export const STAT_KEYS = [
  "intelligence", "creativity", "emotionalControl", "empathy", "social",
  "communication", "ambition", "discipline", "professionalism", "financialSense",
  "risk", "luck", "energy", "humor", "chaos",
] as const;

export const STAT_RANGE = { min: 0, max: 100 } as const;

export type StatKey = (typeof STAT_KEYS)[number];
export type Stats = Record<StatKey, number>;
export type StatEffects = Partial<Record<StatKey, number>>;
export type IdealProfile = Partial<Stats>;
export type Locale = "en" | "fr" | "es";
export type LocaleCode = Locale;
export type LocalizedText = Record<Locale, string>;

export interface Answer { id: string; text: LocalizedText; effects: StatEffects; selectionWeight?: number; }
export interface Question { id: string; category: string; selectionWeight?: number; text: LocalizedText; answers: Answer[]; }

export interface NamedProfile {
  id: string;
  name: LocalizedText;
  description?: LocalizedText;
  idealProfile: IdealProfile;
  worthPotential?: { min: number; max: number };
  tags?: string[];
}

export interface TextProfile {
  id: string;
  text: LocalizedText;
  description?: LocalizedText;
  idealProfile: IdealProfile;
  tags?: string[];
}

export type ProfileEntity = NamedProfile | TextProfile;
export type Career = NamedProfile & { worthPotential: { min: number; max: number } };
export type Animal = NamedProfile;
export type AnimalProfile = Animal;
export type Class = NamedProfile;
export type ClassProfile = Class;
export type Power = TextProfile;
export type PowerEntry = Power;
export type Ability = TextProfile;
export type AbilityEntry = Ability;
export type WorkStyle = TextProfile;
export type WorkStyleEntry = WorkStyle;
export type WeaknessEntry = TextProfile & { lowProfile: IdealProfile };

export interface Alignment extends NamedProfile {
  lawfulChaotic: [number, number];
  selflessSelfInterested: [number, number];
}

export interface StatCondition {
  stat: StatKey;
  op: ">" | ">=" | "<" | "<=" | "==";
  value: number;
}
export type SynergyCondition = StatCondition;

export interface SynergyRule { id: string; conditions: SynergyCondition[]; weight: number; rarityScore: number; tags: string[]; }
export interface MatchedRule extends SynergyRule { matched: boolean; }

export interface ContentPack {
  questions: Question[];
  careers: Career[];
  animals: Animal[];
  classes: Class[];
  powers: Power[];
  weaknesses: WeaknessEntry[];
  abilities: Ability[];
  workStyles: WorkStyle[];
  alignments: Alignment[];
  synergyRules: SynergyRule[];
}

export interface MatchBaseline { mean: number; std: number; }
export type MatchBaselineSet = Record<string, MatchBaseline>;
export interface MatchBaselines {
  careers: MatchBaselineSet;
  classes: MatchBaselineSet;
  powers: MatchBaselineSet;
  weaknesses: MatchBaselineSet;
  abilities: MatchBaselineSet;
  workStyles: MatchBaselineSet;
  animals: MatchBaselineSet;
}

export interface DerivedStats { [key: string]: number | undefined; }
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
