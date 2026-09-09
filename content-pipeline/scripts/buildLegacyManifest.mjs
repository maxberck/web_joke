import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const dataDir = resolve(root, "src/data");
const output = resolve(root, "content-pipeline/fixtures/legacy-content-manifest.json");

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const fromData = (name) => readJson(resolve(dataDir, name));

function indexById(entries, mapper = (entry) => entry) {
  return Object.fromEntries(
    [...entries]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((entry) => [entry.id, mapper(entry)]),
  );
}

function snapshotQuestion(question) {
  return {
    id: question.id,
    category: question.category,
    selectionWeight: question.selectionWeight ?? 1,
    text: question.text,
    answers: question.answers.map(({ id, text, effects, selectionWeight }) => ({
      id,
      text,
      effects,
      selectionWeight: selectionWeight ?? 1,
    })),
  };
}

function snapshotComparable(entry) {
  const comparable = {};
  for (const key of [
    "id",
    "name",
    "text",
    "description",
    "idealProfile",
    "lowProfile",
    "worthPotential",
    "tags",
    "lawfulChaotic",
    "selflessSelfInterested",
    "conditions",
    "weight",
    "rarityScore",
  ]) {
    if (Object.hasOwn(entry, key)) comparable[key] = entry[key];
  }
  return comparable;
}

const [
  questionsBase,
  questionsExpansion,
  questionsExtra,
  questionsMoreWork,
  questionsMoreSocial,
  questionsMoreLife,
  resultsExtra,
  careersBase,
  careersExpansion,
  classesBase,
  classesExpansion,
  powersBase,
  powersExpansion,
  weaknessesBase,
  weaknessesExpansion,
  abilitiesBase,
  abilitiesExpansion,
  workStylesBase,
  workStylesExpansion,
  animalsBase,
  animalsExpansion,
  alignments,
  synergyBase,
  synergyExtra,
  synergyExpansion,
] = await Promise.all([
  fromData("questions.json"),
  fromData("questions.expansion.json"),
  fromData("questions.extra.json"),
  fromData("questions.more.work.json"),
  fromData("questions.more.social.json"),
  fromData("questions.more.life.json"),
  fromData("results.extra.json"),
  fromData("careers.json"),
  fromData("careers.expansion.json"),
  fromData("classes.json"),
  fromData("classes.expansion.json"),
  fromData("powers.json"),
  fromData("powers.expansion.json"),
  fromData("weaknesses.json"),
  fromData("weaknesses.expansion.json"),
  fromData("abilities.json"),
  fromData("abilities.expansion.json"),
  fromData("workStyles.json"),
  fromData("workStyles.expansion.json"),
  fromData("animals.json"),
  fromData("animals.expansion.json"),
  fromData("alignments.json"),
  fromData("synergyRules.json"),
  fromData("synergyRules.extra.json"),
  fromData("synergyRules.expansion.json"),
]);

const questions = [
  ...questionsBase,
  ...questionsExpansion,
  ...questionsExtra,
  ...questionsMoreWork,
  ...questionsMoreSocial,
  ...questionsMoreLife,
];

const groups = {
  careers: [...careersBase, ...resultsExtra.careers, ...careersExpansion],
  classes: [...classesBase, ...resultsExtra.classes, ...classesExpansion],
  powers: [...powersBase, ...resultsExtra.powers, ...powersExpansion],
  weaknesses: [...weaknessesBase, ...resultsExtra.weaknesses, ...weaknessesExpansion],
  abilities: [...abilitiesBase, ...resultsExtra.abilities, ...abilitiesExpansion],
  workStyles: [...workStylesBase, ...resultsExtra.workStyles, ...workStylesExpansion],
  animals: [...animalsBase, ...resultsExtra.animals, ...animalsExpansion],
  alignments,
  synergyRules: [...synergyBase, ...synergyExtra, ...synergyExpansion],
};

const manifest = {
  questions: indexById(questions, snapshotQuestion),
  ...Object.fromEntries(
    Object.entries(groups).map(([group, entries]) => [group, indexById(entries, snapshotComparable)]),
  ),
};

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(
  `Legacy manifest OK: questions=${questions.length}, answers=${questions.reduce((n, q) => n + q.answers.length, 0)}, careers=${groups.careers.length}, classes=${groups.classes.length}, powers=${groups.powers.length}, weaknesses=${groups.weaknesses.length}, abilities=${groups.abilities.length}, workStyles=${groups.workStyles.length}, animals=${groups.animals.length}, alignments=${groups.alignments.length}, synergies=${groups.synergyRules.length}`,
);
