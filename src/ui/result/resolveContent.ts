import type { ContentPack } from "@final-form/shared-types";

/** Cherche une entrée par id dans une des listes du ContentPack, avec message d'erreur clair. */
export function resolveById<T extends { id: string }>(list: T[], id: string, listName: string): T {
  const found = list.find((item) => item.id === id);
  if (!found) throw new Error(`resolveById: "${id}" introuvable dans ${listName}. Contenu manquant ou désynchronisé.`);
  return found;
}
export function resolveCareer(content: ContentPack, id: string) { return resolveById(content.careers, id, "careers"); }
export function resolveClass(content: ContentPack, id: string) { return resolveById(content.classes, id, "classes"); }
export function resolvePower(content: ContentPack, id: string) { return resolveById(content.powers, id, "powers"); }
export function resolveWeakness(content: ContentPack, id: string) { return resolveById(content.weaknesses, id, "weaknesses"); }
export function resolveAnimal(content: ContentPack, id: string) { return resolveById(content.animals, id, "animals"); }
export function resolveAbility(content: ContentPack, id: string) { return resolveById(content.abilities, id, "abilities"); }
export function resolveWorkStyle(content: ContentPack, id: string) { return resolveById(content.workStyles, id, "workStyles"); }
export function resolveAlignment(content: ContentPack, id: string) { return resolveById(content.alignments, id, "alignments"); }
