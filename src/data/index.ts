import type { ContentPack, MatchBaselines } from "@final-form/shared-types";
import questionsRaw from "./questions.json" with { type: "json" };
import careersRaw from "./careers.json" with { type: "json" };
import animalsRaw from "./animals.json" with { type: "json" };
import classesRaw from "./classes.json" with { type: "json" };
import powersRaw from "./powers.json" with { type: "json" };
import weaknessesRaw from "./weaknesses.json" with { type: "json" };
import abilitiesRaw from "./abilities.json" with { type: "json" };
import workStylesRaw from "./workStyles.json" with { type: "json" };
import alignmentsRaw from "./alignments.json" with { type: "json" };
import synergyRulesRaw from "./synergyRules.json" with { type: "json" };
import matchBaselinesRaw from "./matchBaselines.json" with { type: "json" };

export const contentPack: ContentPack = {
  questions: questionsRaw as ContentPack["questions"],
  careers: careersRaw as ContentPack["careers"],
  animals: animalsRaw as ContentPack["animals"],
  classes: classesRaw as ContentPack["classes"],
  powers: powersRaw as ContentPack["powers"],
  weaknesses: weaknessesRaw as ContentPack["weaknesses"],
  abilities: abilitiesRaw as ContentPack["abilities"],
  workStyles: workStylesRaw as ContentPack["workStyles"],
  alignments: alignmentsRaw as ContentPack["alignments"],
  synergyRules: synergyRulesRaw as ContentPack["synergyRules"],
};

/**
 * Baselines de matching normalisé (voir engine/result/profileMatch.ts).
 * Générées par simulation/buildMatchBaselines.ts — à régénérer après tout changement
 * significatif du contenu (nouvelles questions, nouveaux idealProfile, etc.).
 */
export const matchBaselines: MatchBaselines = matchBaselinesRaw as MatchBaselines;

/**
 * Vérifications minimales de cohérence du contenu au chargement (dev only).
 * Le pipeline de contenu (content-pipeline/scripts/validateContent.ts) fait
 * des vérifications plus poussées en amont ; ceci est un filet de sécurité.
 */
export function assertContentPackIsValid(pack: ContentPack): void {
  if (pack.questions.length === 0) throw new Error("ContentPack: aucune question chargée");
  for (const q of pack.questions) {
    if (q.answers.length < 3) {
      throw new Error(`Question ${q.id}: moins de 3 réponses (${q.answers.length})`);
    }
  }
  for (const list of [
    pack.careers,
    pack.animals,
    pack.classes,
    pack.powers,
    pack.weaknesses,
    pack.abilities,
    pack.workStyles,
  ]) {
    if (list.length === 0) {
      throw new Error("ContentPack: une table de résultats est vide, le moteur plantera sur findBestMatch");
    }
  }
}
