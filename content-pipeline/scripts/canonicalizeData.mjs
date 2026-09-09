import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const dataDir = resolve(root, "src/data");
const questionDir = resolve(dataDir, "questions");
const readJson = async (name) => JSON.parse(await readFile(resolve(dataDir, name), "utf8"));
const writeJson = async (path, value) => writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");

const THEMES = ["work", "social", "life", "personality", "general"];
const CAPACITY = 20;
const HINTS = {
  work: ["work", "office", "meeting", "boss", "cowork", "deadline", "job", "email", "project", "career", "client", "printer", "spreadsheet", "wifi", "password"],
  social: ["social", "friend", "party", "group", "chat", "date", "relationship", "neighbor", "queue", "restaurant", "call", "argument", "people", "message"],
  life: ["life", "money", "weekend", "train", "food", "home", "phone", "subscription", "hobby", "recipe", "alarm", "travel", "wallet", "cash", "daily"],
  personality: ["personality", "moral", "choice", "react", "feel", "fear", "truth", "secret", "rule", "risk", "ambition", "emotion", "decision", "value", "pressure"],
  general: ["general", "random", "internet", "game", "idea", "luck", "challenge", "unexpected", "free", "problem"],
};

function themeScore(question, theme, preferredTheme) {
  const haystack = `${question.category ?? ""} ${question.text?.en ?? ""} ${question.text?.fr ?? ""}`.toLowerCase();
  let score = preferredTheme === theme ? 25 : 0;
  if ((question.category ?? "").toLowerCase() === theme) score += 20;
  for (const hint of HINTS[theme]) {
    if (haystack.includes(hint)) score += hint.length >= 6 ? 4 : 2;
  }
  return score;
}

function assignQuestions(entries) {
  const buckets = Object.fromEntries(THEMES.map((theme) => [theme, []]));
  const ranked = entries
    .map((entry) => {
      const scores = THEMES.map((theme) => ({ theme, score: themeScore(entry.question, theme, entry.preferredTheme) }))
        .sort((a, b) => b.score - a.score || a.theme.localeCompare(b.theme));
      return { ...entry, scores, confidence: scores[0].score - scores[1].score };
    })
    .sort((a, b) => b.confidence - a.confidence || b.scores[0].score - a.scores[0].score || a.question.id.localeCompare(b.question.id));

  for (const item of ranked) {
    const target = item.scores.find(({ theme }) => buckets[theme].length < CAPACITY)?.theme;
    if (!target) throw new Error(`Impossible de classer ${item.question.id}: tous les thèmes sont pleins`);
    buckets[target].push(item.question);
  }

  for (const theme of THEMES) {
    if (buckets[theme].length !== CAPACITY) {
      throw new Error(`${theme}: ${buckets[theme].length} questions au lieu de ${CAPACITY}`);
    }
    buckets[theme].sort((a, b) => a.id.localeCompare(b.id));
  }
  return buckets;
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
  synergyBase,
  synergyExtra,
  synergyExpansion,
] = await Promise.all([
  readJson("questions.json"),
  readJson("questions.expansion.json"),
  readJson("questions.extra.json"),
  readJson("questions.more.work.json"),
  readJson("questions.more.social.json"),
  readJson("questions.more.life.json"),
  readJson("results.extra.json"),
  readJson("careers.json"),
  readJson("careers.expansion.json"),
  readJson("classes.json"),
  readJson("classes.expansion.json"),
  readJson("powers.json"),
  readJson("powers.expansion.json"),
  readJson("weaknesses.json"),
  readJson("weaknesses.expansion.json"),
  readJson("abilities.json"),
  readJson("abilities.expansion.json"),
  readJson("workStyles.json"),
  readJson("workStyles.expansion.json"),
  readJson("animals.json"),
  readJson("animals.expansion.json"),
  readJson("synergyRules.json"),
  readJson("synergyRules.extra.json"),
  readJson("synergyRules.expansion.json"),
]);

const taggedQuestions = [
  ...questionsBase.map((question) => ({ question })),
  ...questionsExpansion.map((question) => ({ question })),
  ...questionsExtra.map((question) => ({ question })),
  ...questionsMoreWork.map((question) => ({ question, preferredTheme: "work" })),
  ...questionsMoreSocial.map((question) => ({ question, preferredTheme: "social" })),
  ...questionsMoreLife.map((question) => ({ question, preferredTheme: "life" })),
];

if (taggedQuestions.length !== 100) {
  throw new Error(`Canonicalisation attend 100 questions historiques, reçu ${taggedQuestions.length}`);
}

const questionIds = new Set(taggedQuestions.map(({ question }) => question.id));
if (questionIds.size !== taggedQuestions.length) throw new Error("IDs de questions historiques dupliqués");

const buckets = assignQuestions(taggedQuestions);
await mkdir(questionDir, { recursive: true });
for (const theme of THEMES) await writeJson(resolve(questionDir, `${theme}.json`), buckets[theme]);

const canonicalGroups = {
  careers: [...careersBase, ...resultsExtra.careers, ...careersExpansion],
  classes: [...classesBase, ...resultsExtra.classes, ...classesExpansion],
  powers: [...powersBase, ...resultsExtra.powers, ...powersExpansion],
  weaknesses: [...weaknessesBase, ...resultsExtra.weaknesses, ...weaknessesExpansion],
  abilities: [...abilitiesBase, ...resultsExtra.abilities, ...abilitiesExpansion],
  workStyles: [...workStylesBase, ...resultsExtra.workStyles, ...workStylesExpansion],
  animals: [...animalsBase, ...resultsExtra.animals, ...animalsExpansion],
  synergyRules: [...synergyBase, ...synergyExtra, ...synergyExpansion],
};

const expected = { careers: 50, classes: 30, powers: 30, weaknesses: 30, abilities: 30, workStyles: 30, animals: 30, synergyRules: 45 };
for (const [group, entries] of Object.entries(canonicalGroups)) {
  const ids = new Set(entries.map((entry) => entry.id));
  if (ids.size !== entries.length) throw new Error(`${group}: IDs dupliqués pendant la fusion`);
  if (entries.length !== expected[group]) throw new Error(`${group}: ${entries.length} entrées au lieu de ${expected[group]}`);
  await writeJson(resolve(dataDir, `${group}.json`), entries);
}

console.log(
  `Canonicalisation OK: ${THEMES.map((theme) => `${theme}=${buckets[theme].length}`).join(", ")}; careers=50; autres=30; synergies=45`,
);
