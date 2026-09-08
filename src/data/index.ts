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

export const matchBaselines: MatchBaselines = matchBaselinesRaw as MatchBaselines;

export function assertContentPackIsValid(pack: ContentPack): void {
  if (pack.questions.length < 20) throw new Error("ContentPack: au moins 20 questions sont requises");

  const validateIds = (name: string, entries: Array<{ id: string }>) => {
    const ids = new Set<string>();
    for (const entry of entries) {
      if (!entry.id || ids.has(entry.id)) throw new Error(`ContentPack: ID ${name} dupliqué ou vide: ${entry.id}`);
      ids.add(entry.id);
    }
  };

  validateIds("question", pack.questions);
  validateIds("career", pack.careers);
  validateIds("animal", pack.animals);
  validateIds("class", pack.classes);
  validateIds("power", pack.powers);
  validateIds("weakness", pack.weaknesses);
  validateIds("ability", pack.abilities);
  validateIds("workStyle", pack.workStyles);
  validateIds("alignment", pack.alignments);
  validateIds("synergy", pack.synergyRules);

  for (const question of pack.questions) {
    if (question.answers.length < 3) throw new Error(`Question ${question.id}: moins de 3 réponses`);
    validateIds(`answer:${question.id}`, question.answers);
    for (const answer of question.answers) {
      for (const [key, value] of Object.entries(answer.effects)) {
        if (!Number.isFinite(value)) throw new Error(`Réponse ${answer.id}: effet ${key} non fini`);
      }
    }
  }

  const resultLists = [pack.careers, pack.animals, pack.classes, pack.powers, pack.weaknesses, pack.abilities, pack.workStyles];
  for (const list of resultLists) {
    if (list.length === 0) throw new Error("ContentPack: une table de résultats est vide");
    for (const entry of list) {
      const profile = "lowProfile" in entry ? entry.lowProfile : entry.idealProfile;
      if (Object.keys(profile).length === 0) throw new Error(`Entry ${entry.id}: profil vide`);
      for (const value of Object.values(profile)) {
        if (!Number.isFinite(value) || value < 0 || value > 100) throw new Error(`Entry ${entry.id}: valeur de profil invalide`);
      }
    }
  }

  if (pack.alignments.length === 0) throw new Error("ContentPack: aucune alignment");
  for (const alignment of pack.alignments) {
    if (alignment.lawfulChaotic.length !== 2 || alignment.selflessSelfInterested.length !== 2) throw new Error(`Alignment ${alignment.id}: axes invalides`);
  }

  for (const rule of pack.synergyRules) {
    if (rule.conditions.length === 0 || !Number.isFinite(rule.rarityScore)) throw new Error(`Synergy ${rule.id}: règle invalide`);
  }
}

assertContentPackIsValid(contentPack);
