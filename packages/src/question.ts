import type { StatEffects } from "./stats.ts";

export type LocaleCode = "en" | "fr" | "es";

export type LocalizedText = Record<LocaleCode, string>;

export interface Answer {
  id: string;
  text: LocalizedText;
  effects: StatEffects;
  /** Poids de sélection parmi les 10 réponses (section 4). Défaut 1. */
  selectionWeight?: number;
}

export interface Question {
  id: string;
  category: string;
  tags?: string[];
  text: LocalizedText;
  /** Toujours 10 réponses au total dans le pool complet. */
  answers: Answer[];
  /** Poids de sélection de la question elle-même parmi le pool (section 5). */
  selectionWeight?: number;
}
