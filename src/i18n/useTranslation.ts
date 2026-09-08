import type { LocaleCode, StatKey } from "@final-form/shared-types";

const UI_STRINGS = {
  start: { en: "Start", fr: "Commencer", es: "Empezar" },
  next: { en: "Next", fr: "Suivant", es: "Siguiente" },
  analyzing: { en: "ANALYZING YOUR PROFILE...", fr: "ANALYSE DE TON PROFIL...", es: "ANALIZANDO TU PERFIL..." },
  yourFinalForm: { en: "YOUR FINAL FORM", fr: "TA FORME FINALE", es: "TU FORMA FINAL" },
  tryAgain: { en: "Try Again", fr: "Recommencer", es: "Intentar de nuevo" },
  career: { en: "Career", fr: "Métier", es: "Profesión" },
  worth: { en: "Worth", fr: "Fortune", es: "Patrimonio" },
  rarity: { en: "Rarity", fr: "Rareté", es: "Rareza" },
  power: { en: "Power", fr: "Pouvoir", es: "Poder" },
  weakness: { en: "Weakness", fr: "Faiblesse", es: "Debilidad" },
  animal: { en: "Animal", fr: "Animal", es: "Animal" },
  threatLevel: { en: "Threat Level", fr: "Niveau de Menace", es: "Nivel de Amenaza" },
  alignment: { en: "Alignment", fr: "Alignement", es: "Alineamiento" },
  lifeExpectancy: { en: "Life Expectancy", fr: "Espérance de Vie", es: "Esperanza de Vida" },
  workStyle: { en: "Work Style", fr: "Style de Travail", es: "Estilo de Trabajo" },
  tagline: {
    en: "The calculation is serious. The result is not.",
    fr: "Le calcul est sérieux. Le résultat ne l'est pas.",
    es: "El cálculo es serio. El resultado no lo es.",
  },
  changeLanguage: { en: "Language", fr: "Langue", es: "Idioma" },
} as const satisfies Record<string, Record<LocaleCode, string>>;

export type UiStringKey = keyof typeof UI_STRINGS;

export function useTranslation(locale: LocaleCode) {
  return (key: UiStringKey) => UI_STRINGS[key][locale];
}

/** Libellés traduits des 15 stats de base (jamais afficher la clé technique brute à l'utilisateur). */
const STAT_LABELS: Record<StatKey, Record<LocaleCode, string>> = {
  intelligence: { en: "Intelligence", fr: "Intelligence", es: "Inteligencia" },
  humor: { en: "Humor", fr: "Humour", es: "Humor" },
  discipline: { en: "Discipline", fr: "Discipline", es: "Disciplina" },
  luck: { en: "Luck", fr: "Chance", es: "Suerte" },
  social: { en: "Social", fr: "Social", es: "Social" },
  emotionalControl: { en: "Emotional Control", fr: "Contrôle Émotionnel", es: "Control Emocional" },
  creativity: { en: "Creativity", fr: "Créativité", es: "Creatividad" },
  ambition: { en: "Ambition", fr: "Ambition", es: "Ambición" },
  energy: { en: "Energy", fr: "Énergie", es: "Energía" },
  professionalism: { en: "Professionalism", fr: "Professionnalisme", es: "Profesionalismo" },
  communication: { en: "Communication", fr: "Communication", es: "Comunicación" },
  financialSense: { en: "Financial Sense", fr: "Sens Financier", es: "Sentido Financiero" },
  chaos: { en: "Chaos", fr: "Chaos", es: "Caos" },
  risk: { en: "Risk", fr: "Risque", es: "Riesgo" },
  empathy: { en: "Empathy", fr: "Empathie", es: "Empatía" },
};

export function useStatLabel(locale: LocaleCode) {
  return (key: StatKey) => STAT_LABELS[key][locale];
}
