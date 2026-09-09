import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const dataDir = resolve(root, "src/data");
const manifestPath = resolve(root, "content-pipeline/fixtures/legacy-content-manifest.json");
const QUESTION_FILES = ["work", "social", "life", "personality", "general"];
const RESULT_GROUPS = ["careers", "classes", "powers", "weaknesses", "abilities", "workStyles", "animals", "alignments", "synergyRules"];

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

for (const name of QUESTION_FILES) {
  await access(resolve(dataDir, "questions", `${name}.json`));
}
await access(manifestPath);

const manifest = await readJson(manifestPath);
const canonicalQuestions = (
  await Promise.all(QUESTION_FILES.map((name) => readJson(resolve(dataDir, "questions", `${name}.json`))))
).flat();
const questionById = new Map(canonicalQuestions.map((question) => [question.id, question]));

for (const [id, legacy] of Object.entries(manifest.questions)) {
  const current = questionById.get(id);
  assert.ok(current, `question historique manquante: ${id}`);
  assert.equal(current.category, legacy.category, `category modifiée: ${id}`);
  assert.equal(current.selectionWeight ?? 1, legacy.selectionWeight ?? 1, `selectionWeight modifié: ${id}`);
  assert.deepEqual(current.text, legacy.text, `texte question modifié: ${id}`);
  assert.deepEqual(
    current.answers.map(({ id: answerId, text, effects, selectionWeight }) => ({
      id: answerId,
      text,
      effects,
      selectionWeight: selectionWeight ?? 1,
    })),
    legacy.answers,
    `réponses historiques modifiées: ${id}`,
  );
}

function snapshotComparable(entry) {
  const comparable = {};
  for (const key of ["id", "name", "text", "description", "idealProfile", "lowProfile", "worthPotential", "tags", "lawfulChaotic", "selflessSelfInterested", "conditions", "weight", "rarityScore"]) {
    if (Object.hasOwn(entry, key)) comparable[key] = entry[key];
  }
  return comparable;
}

for (const group of RESULT_GROUPS) {
  const canonical = await readJson(resolve(dataDir, `${group}.json`));
  const byId = new Map(canonical.map((entry) => [entry.id, entry]));
  const legacyEntries = manifest[group] ?? {};
  for (const [id, legacy] of Object.entries(legacyEntries)) {
    const current = byId.get(id);
    assert.ok(current, `${group}: entrée historique manquante: ${id}`);
    assert.deepEqual(snapshotComparable(current), legacy, `${group}: entrée historique modifiée: ${id}`);
  }
}

const runtimeIndex = await readFile(resolve(dataDir, "index.ts"), "utf8");
for (const forbidden of [
  "./questions.json",
  "questions.expansion.json",
  "questions.extra.json",
  "questions.more.",
  ".expansion.json",
  "results.extra.json",
  "synergyRules.extra.json",
  "matchBaselines.extra.json",
  "rarityDistribution.json",
]) {
  assert.equal(runtimeIndex.includes(forbidden), false, `src/data/index.ts référence encore ${forbidden}`);
}

console.log(
  `Migration canonique OK: ${Object.keys(manifest.questions).length} questions historiques préservées`,
);
