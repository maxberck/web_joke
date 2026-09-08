import type { Stats, StatKey } from "./stats.ts";
import type { LocalizedText } from "./question.ts";

/** Profil statistique idéal utilisé pour calculer une compatibilité (distance). */
export type IdealProfile = Partial<Record<StatKey, number>>;

export interface Career {
  id: string;
  name: LocalizedText;
  idealProfile: IdealProfile;
  /** Fourchette de potentiel financier utilisée par le calcul de Worth (section 19). */
  worthPotential: { min: number; max: number };
  tags?: string[];
}

export interface AnimalProfile {
  id: string;
  name: LocalizedText;
  idealProfile: IdealProfile;
}

export interface ClassProfile {
  id: string;
  name: LocalizedText;
  idealProfile: IdealProfile;
}

export interface PowerEntry {
  id: string;
  text: LocalizedText;
  idealProfile: IdealProfile;
}

export interface WeaknessEntry {
  id: string;
  text: LocalizedText;
  /** Une weakness est choisie sur des stats FAIBLES : on stocke le profil "bas" recherché. */
  lowProfile: IdealProfile;
}

export interface AbilityEntry {
  id: string;
  text: LocalizedText;
  idealProfile: IdealProfile;
}

/** Style de travail humoristique (section demandée en plus de Power/Weakness/Ability). */
export interface WorkStyleEntry {
  id: string;
  text: LocalizedText;
  idealProfile: IdealProfile;
}

export type AlignmentAxis = "lawfulChaotic" | "selflessSelfInterested";

export interface AlignmentEntry {
  id: string; // ex: "lawful_good"
  name: LocalizedText;
  description: LocalizedText;
  /** -100 (lawful/selfless) à +100 (chaotic/self-interested) */
  lawfulChaotic: [number, number];
  selflessSelfInterested: [number, number];
}

export interface ContentPack {
  questions: import("./question.ts").Question[];
  careers: Career[];
  animals: AnimalProfile[];
  classes: ClassProfile[];
  powers: PowerEntry[];
  weaknesses: WeaknessEntry[];
  abilities: AbilityEntry[];
  workStyles: WorkStyleEntry[];
  alignments: AlignmentEntry[];
  synergyRules: import("./synergy.ts").SynergyRule[];
}

export type { Stats };
