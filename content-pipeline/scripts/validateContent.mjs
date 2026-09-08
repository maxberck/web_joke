import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const dataDir = resolve(root, "src/data");
const files = ["questions", "careers", "animals", "classes", "powers", "weaknesses", "abilities", "workStyles", "alignments", "synergyRules"];
const locales = ["en", "fr", "es"];

const load = async (name) => JSON.parse(await readFile(resolve(dataDir, `${name}.json`), "utf8"));
const seen = (entries, label) => {
  const ids = new Set();
  for (const entry of entries) {
    if (!entry?.id || ids.has(entry.id)) throw new Error(`${label}: duplicate/empty id ${entry?.id ?? "<empty>"}`);
    ids.add(entry.id);
  }
};
const finiteRange = (value, label) => {
  if (!Number.isFinite(value) || value < 0 || value > 100) throw new Error(`${label}: expected finite value in 0..100`);
};
const localized = (value, label) => {
  for (const locale of locales) if (typeof value?.[locale] !== "string" || value[locale].trim() === "") throw new Error(`${label}: missing ${locale}`);
};

const data = Object.fromEntries(await Promise.all(files.map(async (name) => [name, await load(name)])));
if (data.questions.length < 20) throw new Error(`questions: ${data.questions.length} available, at least 20 required`);
seen(data.questions, "questions");
for (const question of data.questions) {
  localized(question.text, `question ${question.id}`);
  seen(question.answers, `answers for ${question.id}`);
  if (question.answers.length < 3) throw new Error(`question ${question.id}: fewer than 3 answers`);
  for (const answer of question.answers) {
    localized(answer.text, `answer ${answer.id}`);
    for (const [stat, value] of Object.entries(answer.effects ?? {})) {
      if (!Number.isFinite(value)) throw new Error(`answer ${answer.id}: invalid effect ${stat}`);
    }
  }
}

for (const name of files.slice(1, 7)) {
  seen(data[name], name);
  for (const entry of data[name]) {
    localized(entry.name, `${name} ${entry.id}`);
    const profile = entry.lowProfile ?? entry.idealProfile;
    if (!profile || Object.keys(profile).length === 0) throw new Error(`${name} ${entry.id}: empty profile`);
    for (const [stat, value] of Object.entries(profile)) finiteRange(value, `${name} ${entry.id}.${stat}`);
  }
}

seen(data.workStyles, "workStyles");
seen(data.alignments, "alignments");
seen(data.synergyRules, "synergyRules");
for (const alignment of data.alignments) {
  localized(alignment.name, `alignment ${alignment.id}`);
  if (alignment.lawfulChaotic?.length !== 2 || alignment.selflessSelfInterested?.length !== 2) throw new Error(`alignment ${alignment.id}: invalid axes`);
}
for (const rule of data.synergyRules) {
  if (!Array.isArray(rule.conditions) || rule.conditions.length === 0) throw new Error(`synergy ${rule.id}: empty conditions`);
  if (!Number.isFinite(rule.rarityScore)) throw new Error(`synergy ${rule.id}: invalid rarity score`);
}

console.log(`Content validation passed: ${data.questions.length} questions, ${data.careers.length} careers, ${data.classes.length} classes.`);
