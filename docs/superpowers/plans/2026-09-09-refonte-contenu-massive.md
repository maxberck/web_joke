# Refonte massive du contenu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrer toutes les données vers une structure canonique simple, porter le quiz à 150 questions / 1 500 réponses et fortement augmenter tous les catalogues de résultats sans casser le gameplay ni la rareté hybride.

**Architecture:** `src/data/index.ts` ne chargera plus aucune source `extra`, `expansion` ou `more`. Les questions seront réparties dans cinq fichiers canoniques, les autres groupes auront un seul JSON chacun, et les simulations de baselines/calibration partageront les vrais sélecteurs du jeu pour rester synchronisées avec le runtime.

**Tech Stack:** TypeScript, React, Vite, Node.js 24 pour les scripts de simulation/parité et en CI, JSON, scripts ESM `.mjs`, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-09-refonte-contenu-massive-design.md`

## Global Constraints

- Exactement 150 questions et 1 500 réponses, avec 10 réponses par question.
- Exactement 30 questions dans chacun de `work.json`, `social.json`, `life.json`, `personality.json`, `general.json`.
- Exactement 100 métiers.
- Exactement 75 classes, 75 pouvoirs, 75 faiblesses, 75 capacités, 75 styles de travail et 75 animaux.
- Exactement 9 alignements.
- Entre 90 et 110 synergies, cible ~100.
- Tous les textes visibles doivent exister en `en`, `fr`, `es`.
- Tous les IDs existants et les `question.category` des 100 questions historiques doivent être préservés.
- Une partie reste à 20 questions et 3 réponses affichées par question.
- La logique actuelle de `selectQuestions` et `selectAnswers` ne change pas dans ce chantier.
- `appearanceCalibration.json` est généré avec 200 000 parties déterministes et versionné.
- `matchBaselines.json` devient la seule source de baselines.
- Aucun fichier `extra`, `expansion` ou `more` ne reste dans le runtime final.
- Les scripts de simulation qui importent directement les sélecteurs TypeScript sont exécutés avec Node 24, comme la CI.
- TDD : chaque changement de comportement ou de validation commence par un test/validateur qui échoue.

---

### Task 1: Capturer le contenu historique et verrouiller la migration

**Files:**
- Create: `content-pipeline/scripts/buildLegacyManifest.mjs`
- Create: `content-pipeline/fixtures/legacy-content-manifest.json`
- Create: `content-pipeline/scripts/validateCanonicalMigration.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: toutes les sources actuelles `questions*.json`, `results.extra.json`, `*.expansion.json`, `synergyRules*.json`.
- Produces: un snapshot immuable des IDs, catégories et contenus historiques ; commande `npm run content:validate-migration`.

- [ ] **Step 1: Écrire le validateur RED avant la nouvelle structure**

Créer `validateCanonicalMigration.mjs` avec les imports `node:assert/strict`, `node:fs/promises` (`access`, `readFile`) et `node:path` (`resolve`). Il exige les cinq fichiers canoniques puis compare les entrées au manifest :

```js
const REQUIRED_QUESTION_FILES = ["work", "social", "life", "personality", "general"];
for (const name of REQUIRED_QUESTION_FILES) {
  await access(resolve(dataDir, "questions", `${name}.json`));
}

for (const [id, legacy] of Object.entries(manifest.questions)) {
  const current = questionById.get(id);
  assert.ok(current, `question historique manquante: ${id}`);
  assert.equal(current.category, legacy.category, `category modifiée: ${id}`);
  assert.deepEqual(current.text, legacy.text, `texte question modifié: ${id}`);
  assert.deepEqual(
    current.answers.map(({ id, text, effects }) => ({ id, text, effects })),
    legacy.answers,
    `réponses historiques modifiées: ${id}`,
  );
}
```

Pour chaque résultat historique, comparer `name`, `text`, `description`, `idealProfile`, `lowProfile` et `worthPotential` uniquement quand la propriété existe dans le snapshot.

- [ ] **Step 2: Lancer le validateur et vérifier le RED**

Run:

```bash
node content-pipeline/scripts/validateCanonicalMigration.mjs
```

Expected: FAIL car `src/data/questions/work.json` et les quatre autres fichiers n’existent pas encore.

- [ ] **Step 3: Générer une fois le manifest depuis les sources historiques**

`buildLegacyManifest.mjs` fusionne exactement les mêmes sources que le runtime actuel, trie les IDs et écrit :

```json
{
  "questions": {},
  "careers": {},
  "classes": {},
  "powers": {},
  "weaknesses": {},
  "abilities": {},
  "workStyles": {},
  "animals": {},
  "alignments": {},
  "synergyRules": {}
}
```

Run:

```bash
node content-pipeline/scripts/buildLegacyManifest.mjs
```

Expected: snapshot couvrant 100 questions, 1 000 réponses, 50 métiers, 30 entrées dans chacun des six autres grands groupes, 9 alignements et 45 synergies.

- [ ] **Step 4: Ajouter les scripts npm**

```json
"content:legacy-manifest": "node content-pipeline/scripts/buildLegacyManifest.mjs",
"content:validate-migration": "node content-pipeline/scripts/validateCanonicalMigration.mjs"
```

- [ ] **Step 5: Commit**

```bash
git add content-pipeline package.json
git commit -m "test: verrouiller la migration canonique du contenu"
```

---

### Task 2: Canonicaliser les 100 questions dans cinq fichiers

**Files:**
- Create: `src/data/questions/work.json`
- Create: `src/data/questions/social.json`
- Create: `src/data/questions/life.json`
- Create: `src/data/questions/personality.json`
- Create: `src/data/questions/general.json`
- Test: `content-pipeline/scripts/validateCanonicalMigration.mjs`

**Interfaces:**
- Consumes: les 100 questions historiques fusionnées.
- Produces: cinq tableaux JSON de 20 questions historiques chacun, sans modification de contenu.

- [ ] **Step 1: Répartir les 100 questions historiques par thème**

Règle exacte : chaque fichier contient 20 questions historiques. Le classement thématique peut déplacer une question entre fichiers mais ne modifie jamais `id`, `category`, `selectionWeight`, `text`, réponses ou effets.

Exemple de forme valide d’une question historique après déplacement :

```json
{
  "id": "q_commute_delay",
  "category": "daily_life",
  "text": {
    "en": "Your train is delayed again. What do you do?",
    "fr": "Ton train est encore en retard. Tu fais quoi ?",
    "es": "Tu tren vuelve a retrasarse. ¿Qué haces?"
  },
  "answers": [
    {
      "id": "q_commute_delay_a1",
      "text": {
        "en": "Open the delay app every thirty seconds.",
        "fr": "Rafraîchir l’application des retards toutes les trente secondes.",
        "es": "Actualizar la aplicación de retrasos cada treinta segundos."
      },
      "effects": { "discipline": 2, "emotionalControl": -1 }
    }
  ]
}
```

Cet exemple illustre uniquement la structure ; lors de la migration, les objets historiques sont copiés byte-for-byte au niveau des valeurs JSON.

- [ ] **Step 2: Exécuter le validateur de migration**

Run:

```bash
npm run content:validate-migration
```

Expected: les comparaisons historiques des questions passent.

- [ ] **Step 3: Vérifier les volumes intermédiaires**

```bash
node --input-type=module -e "import fs from 'node:fs'; for (const n of ['work','social','life','personality','general']) { const q=JSON.parse(fs.readFileSync('src/data/questions/'+n+'.json')); console.log(n,q.length); if(q.length!==20) process.exit(1); }"
```

Expected: `20` pour les cinq fichiers.

- [ ] **Step 4: Commit**

```bash
git add src/data/questions content-pipeline/fixtures/legacy-content-manifest.json
git commit -m "refactor: canonicaliser les questions historiques"
```

---

### Task 3: Canonicaliser tous les catalogues de résultats et synergies

**Files:**
- Modify: `src/data/careers.json`
- Modify: `src/data/classes.json`
- Modify: `src/data/powers.json`
- Modify: `src/data/weaknesses.json`
- Modify: `src/data/abilities.json`
- Modify: `src/data/workStyles.json`
- Modify: `src/data/animals.json`
- Modify: `src/data/synergyRules.json`
- Keep: `src/data/alignments.json`
- Test: `content-pipeline/scripts/validateCanonicalMigration.mjs`

**Interfaces:**
- Consumes: base + `results.extra.json` + fichiers `*.expansion.json`, et base + extra + expansion pour les synergies.
- Produces: un seul fichier canonique par groupe avec les volumes historiques : careers=50, autres grands groupes=30, alignments=9, synergies=45.

- [ ] **Step 1: Fusionner chaque groupe sans modifier les objets**

Ordre canonique : base, puis `results.extra`, puis expansion :

```js
const canonicalCareers = [
  ...careersBase,
  ...resultsExtra.careers,
  ...careersExpansion,
];
```

Écrire le tableau obtenu dans `careers.json`. Répéter pour classes, powers, weaknesses, abilities, workStyles, animals et synergyRules.

- [ ] **Step 2: Vérifier l’absence de perte historique**

Run: `npm run content:validate-migration`
Expected: PASS pour IDs, textes, profils, descriptions et synergies historiques.

- [ ] **Step 3: Vérifier les volumes historiques canoniques**

```bash
node --input-type=module -e "import fs from 'node:fs'; const expected={careers:50,classes:30,powers:30,weaknesses:30,abilities:30,workStyles:30,animals:30,alignments:9,synergyRules:45}; for(const [n,c] of Object.entries(expected)){const a=JSON.parse(fs.readFileSync('src/data/'+n+'.json')); if(a.length!==c) throw new Error(n+': '+a.length+' != '+c);} console.log('historical canonical volumes OK');"
```

Expected: `historical canonical volumes OK`.

- [ ] **Step 4: Commit**

```bash
git add src/data/*.json
git commit -m "refactor: fusionner les catalogues de résultats"
```

---

### Task 4: Basculer le runtime et les validateurs vers la structure canonique

**Files:**
- Modify: `src/data/index.ts`
- Modify: `content-pipeline/scripts/validateContent.mjs`
- Delete: `content-pipeline/scripts/validateExpansion.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: cinq fichiers de questions + fichiers canoniques de résultats.
- Produces: `contentPack`, `matchBaselines`, `appearanceCalibration` sans référence à `extra/expansion/more`.

- [ ] **Step 1: Ajouter le RED contre les références legacy**

```js
const forbiddenNames = ["extra", "expansion", "more"];
const dataIndex = await readFile(resolve(root, "src/data/index.ts"), "utf8");
for (const token of forbiddenNames) {
  if (dataIndex.includes(token)) throw new Error(`src/data/index.ts contient encore ${token}`);
}
```

Run: `npm run content:validate`
Expected: FAIL tant que `src/data/index.ts` importe les anciennes sources.

- [ ] **Step 2: Simplifier `src/data/index.ts`**

```ts
import questionsWork from "./questions/work.json" with { type: "json" };
import questionsSocial from "./questions/social.json" with { type: "json" };
import questionsLife from "./questions/life.json" with { type: "json" };
import questionsPersonality from "./questions/personality.json" with { type: "json" };
import questionsGeneral from "./questions/general.json" with { type: "json" };

const questions = [
  ...questionsWork,
  ...questionsSocial,
  ...questionsLife,
  ...questionsPersonality,
  ...questionsGeneral,
];
```

Importer `careers.json`, `classes.json`, `powers.json`, `weaknesses.json`, `abilities.json`, `workStyles.json`, `animals.json`, `alignments.json`, `synergyRules.json`, `matchBaselines.json`, `appearanceCalibration.json` une seule fois chacun et les utiliser directement dans `contentPack`.

- [ ] **Step 3: Remplacer les validateurs fragmentés**

`validateContent.mjs` charge uniquement les nouvelles sources. À cette étape intermédiaire il valide 100 questions et les volumes historiques ; les assertions de volumes finaux seront activées au fil des Tasks 5-8.

```json
"content:validate": "node content-pipeline/scripts/validateContent.mjs",
"content:validate-migration": "node content-pipeline/scripts/validateCanonicalMigration.mjs"
```

- [ ] **Step 4: Vérifier runtime et types**

```bash
npm run content:validate-migration
npm run content:validate
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/index.ts content-pipeline/scripts package.json
git commit -m "refactor: charger uniquement les données canoniques"
```

---

### Task 5: Porter les questions à 150 / 1 500 réponses

**Files:**
- Modify: `src/data/questions/work.json`
- Modify: `src/data/questions/social.json`
- Modify: `src/data/questions/life.json`
- Modify: `src/data/questions/personality.json`
- Modify: `src/data/questions/general.json`
- Modify: `content-pipeline/scripts/validateContent.mjs`

**Interfaces:**
- Consumes: 20 questions historiques par fichier.
- Produces: 30 questions par fichier, 10 réponses par question, 150 / 1 500.

- [ ] **Step 1: Passer le validateur en RED sur les volumes finaux**

```js
const QUESTION_FILES = {
  work: questionsWork,
  social: questionsSocial,
  life: questionsLife,
  personality: questionsPersonality,
  general: questionsGeneral,
};
for (const [name, entries] of Object.entries(QUESTION_FILES)) {
  assert.equal(entries.length, 30, `${name}: exactement 30 questions requises`);
}
assert.equal(allQuestions.length, 150);
assert.equal(answerCount, 1500);
```

Run: `npm run content:validate`
Expected: FAIL avec 20 questions dans chaque fichier.

- [ ] **Step 2: Ajouter exactement 10 nouvelles questions dans chaque fichier**

Exemple concret de structure d’une nouvelle question :

```json
{
  "id": "q_work_surprise_deadline",
  "category": "work",
  "text": {
    "en": "A deadline suddenly moves to this afternoon. Your first reaction?",
    "fr": "Une deadline passe soudainement à cet après-midi. Ta première réaction ?",
    "es": "Una fecha límite pasa de repente a esta tarde. ¿Tu primera reacción?"
  },
  "answers": [
    {
      "id": "q_work_surprise_deadline_a1",
      "text": {
        "en": "Make a tiny plan and start with the ugliest task.",
        "fr": "Faire un mini-plan et commencer par la tâche la plus pénible.",
        "es": "Hacer un mini plan y empezar por la tarea más desagradable."
      },
      "effects": { "discipline": 5, "emotionalControl": 2, "chaos": -2 }
    }
  ]
}
```

Chaque question finale contient exactement 10 réponses distinctes, toutes traduites, avec uniquement les 15 `STAT_KEYS`. Les 50 nouvelles questions sont réparties exactement 10/10/10/10/10 entre les cinq fichiers.

- [ ] **Step 3: Vérifier volumes et historique**

```bash
npm run content:validate-migration
npm run content:validate
```

Expected: PASS, avec 150 questions et 1 500 réponses.

- [ ] **Step 4: Commit**

```bash
git add src/data/questions content-pipeline/scripts/validateContent.mjs
git commit -m "feat: porter le quiz à 150 questions"
```

---

### Task 6: Étendre métiers, classes et pouvoirs

**Files:**
- Modify: `src/data/careers.json`
- Modify: `src/data/classes.json`
- Modify: `src/data/powers.json`
- Modify: `content-pipeline/scripts/validateContent.mjs`

**Interfaces:**
- Produces: careers=100, classes=75, powers=75.

- [ ] **Step 1: Ajouter les assertions RED**

```js
assert.equal(careers.length, 100, "exactement 100 métiers requis");
assert.equal(classes.length, 75, "exactement 75 classes requises");
assert.equal(powers.length, 75, "exactement 75 pouvoirs requis");
```

Run: `npm run content:validate`
Expected: FAIL avec 50/30/30.

- [ ] **Step 2: Ajouter 50 métiers**

Exemple concret :

```json
{
  "id": "career_robot_ethicist",
  "name": {
    "en": "Robot Ethicist",
    "fr": "Éthicien des robots",
    "es": "Especialista en ética robótica"
  },
  "idealProfile": { "intelligence": 78, "empathy": 72, "creativity": 61, "discipline": 58 },
  "worthPotential": { "min": 42000, "max": 165000 }
}
```

Répartir les 50 nouveaux métiers entre sérieux, absurdes et hybrides ; couvrir des profils très différents et des fourchettes de valeur plausiblement variées.

- [ ] **Step 3: Ajouter 45 classes et 45 pouvoirs**

Exemple de classe :

```json
{
  "id": "class_pattern_hunter",
  "name": { "en": "Pattern Hunter", "fr": "Chasseur de schémas", "es": "Cazador de patrones" },
  "idealProfile": { "intelligence": 82, "creativity": 68, "communication": 45 }
}
```

Exemple de pouvoir :

```json
{
  "id": "power_detects_hidden_assumptions",
  "name": {
    "en": "Detect Hidden Assumptions",
    "fr": "Détecter les hypothèses cachées",
    "es": "Detectar suposiciones ocultas"
  },
  "idealProfile": { "intelligence": 76, "empathy": 57, "risk": 38 }
}
```

- [ ] **Step 4: Vérifier contenu et historique**

```bash
npm run content:validate-migration
npm run content:validate
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/careers.json src/data/classes.json src/data/powers.json content-pipeline/scripts/validateContent.mjs
git commit -m "feat: enrichir métiers classes et pouvoirs"
```

---

### Task 7: Étendre faiblesses, capacités, styles et animaux

**Files:**
- Modify: `src/data/weaknesses.json`
- Modify: `src/data/abilities.json`
- Modify: `src/data/workStyles.json`
- Modify: `src/data/animals.json`
- Modify: `content-pipeline/scripts/validateContent.mjs`

**Interfaces:**
- Produces: 75 entrées dans chacun des quatre groupes.

- [ ] **Step 1: Ajouter les assertions RED**

```js
for (const [name, entries] of Object.entries({ weaknesses, abilities, workStyles, animals })) {
  assert.equal(entries.length, 75, `${name}: exactement 75 entrées requises`);
}
```

Run: `npm run content:validate`
Expected: FAIL avec 30 entrées par groupe.

- [ ] **Step 2: Ajouter 45 faiblesses**

Exemple :

```json
{
  "id": "weakness_too_many_options",
  "text": {
    "en": "Too many equally good options",
    "fr": "Trop d’options également bonnes",
    "es": "Demasiadas opciones igual de buenas"
  },
  "lowProfile": { "emotionalControl": 32, "discipline": 39, "risk": 44 }
}
```

- [ ] **Step 3: Ajouter 45 capacités et 45 styles de travail**

Exemple de capacité :

```json
{
  "id": "ability_spots_missing_step",
  "text": {
    "en": "Spots the missing step",
    "fr": "Repère l’étape manquante",
    "es": "Detecta el paso que falta"
  },
  "idealProfile": { "intelligence": 72, "discipline": 66, "communication": 54 }
}
```

Exemple de style :

```json
{
  "id": "workstyle_two_pass_builder",
  "text": {
    "en": "Build rough, polish second",
    "fr": "Construire brut, polir ensuite",
    "es": "Construir primero, pulir después"
  },
  "idealProfile": { "creativity": 70, "discipline": 58, "risk": 52 }
}
```

- [ ] **Step 4: Ajouter 45 animaux avec descriptions**

```json
{
  "id": "animal_lynx",
  "name": { "en": "Lynx", "fr": "Lynx", "es": "Lince" },
  "description": {
    "en": "Quiet, observant, and already noticed the detail everyone else missed.",
    "fr": "Calme, observateur, et a déjà repéré le détail que tout le monde a raté.",
    "es": "Tranquilo, observador y ya vio el detalle que todos los demás pasaron por alto."
  },
  "idealProfile": { "intelligence": 72, "social": 34, "emotionalControl": 67, "energy": 48 }
}
```

- [ ] **Step 5: Vérifier contenu et historique**

```bash
npm run content:validate-migration
npm run content:validate
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/data/weaknesses.json src/data/abilities.json src/data/workStyles.json src/data/animals.json content-pipeline/scripts/validateContent.mjs
git commit -m "feat: enrichir les profils secondaires"
```

---

### Task 8: Étendre les synergies et finaliser les règles de validation

**Files:**
- Modify: `src/data/synergyRules.json`
- Modify: `content-pipeline/scripts/validateContent.mjs`
- Create: `content-pipeline/scripts/validateSynergyCoverage.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: 90-110 synergies ; commande `npm run synergy:validate`.

- [ ] **Step 1: Ajouter le test RED de volume et structure**

```js
assert.ok(synergyRules.length >= 90 && synergyRules.length <= 110, `synergies=${synergyRules.length}`);
for (const rule of synergyRules) {
  assert.ok(rule.conditions.length > 0);
  assert.ok(Number.isFinite(rule.rarityScore));
}
```

Run: `npm run content:validate`
Expected: FAIL avec 45 synergies.

- [ ] **Step 2: Ajouter environ 55 nouvelles synergies**

Exemple :

```json
{
  "id": "synergy_controlled_improviser",
  "conditions": [
    { "stat": "chaos", "op": ">=", "value": 62 },
    { "stat": "emotionalControl", "op": ">=", "value": 64 }
  ],
  "weight": 1,
  "rarityScore": 6,
  "tags": ["improvised", "controlled"]
}
```

Éviter les doublons logiques et répartir les règles sur différentes combinaisons de stats.

- [ ] **Step 3: Créer `validateSynergyCoverage.mjs`**

Lire le rapport indiqué par `SYNERGY_REPORT` (défaut `simulation/synergyFrequency.json`). Pour chaque règle : FAIL si `frequency > 0.95` ou `frequency < 0.000005`; warning si `0.000005 <= frequency < 0.00005`.

- [ ] **Step 4: Ajouter la commande npm**

```json
"synergy:validate": "node content-pipeline/scripts/validateSynergyCoverage.mjs"
```

- [ ] **Step 5: Commit**

```bash
git add src/data/synergyRules.json content-pipeline/scripts package.json
git commit -m "feat: étendre et contrôler les synergies"
```

---

### Task 9: Partager le chargement et le sampling des simulations

**Files:**
- Create: `simulation/lib/loadCanonicalContent.mjs`
- Create: `simulation/lib/simulateStats.mjs`
- Create: `simulation/validateSamplingParity.mjs`
- Modify: `simulation/package.json`

**Interfaces:**
- Consumes: sources canoniques et sélecteurs runtime `selectQuestions` / `selectAnswers`.
- Produces: `loadCanonicalContent()`, `simulateStats({ questions, rng })`, `mulberry32(seed)`.

- [ ] **Step 1: Écrire le test de parité RED**

Sous Node 24 :

```js
import { selectQuestions, selectAnswers } from "../src/engine/selection/index.ts";
import { loadCanonicalContent } from "./lib/loadCanonicalContent.mjs";
import { simulateStats, mulberry32 } from "./lib/simulateStats.mjs";
```

Avec la seed `0x51A7E123`, vérifier 20 IDs de questions et les 3 IDs de réponses de chaque tour contre des appels directs aux sélecteurs runtime.

Run:

```bash
node --version
node simulation/validateSamplingParity.mjs
```

Expected: Node `v24.x` puis FAIL car les modules `simulation/lib/*` n’existent pas.

- [ ] **Step 2: Implémenter `loadCanonicalContent()`**

Retour exact :

```js
{
  questions,
  careers,
  classes,
  powers,
  weaknesses,
  abilities,
  workStyles,
  animals,
  alignments,
  synergyRules,
  matchBaselines
}
```

Le loader lit uniquement les cinq fichiers de questions et les fichiers canoniques.

- [ ] **Step 3: Implémenter `simulateStats()` avec les vrais sélecteurs**

```js
export function simulateStats({ questions, rng }) {
  const stats = Object.fromEntries(STAT_KEYS.map((key) => [key, 50]));
  const selectedQuestions = selectQuestions(questions, { count: 20, rng });
  const trace = [];
  for (const question of selectedQuestions) {
    const shown = selectAnswers(question.answers, { count: 3, rng });
    const chosen = weightedPick(shown, (answer) => answer.selectionWeight ?? 1, rng);
    applyEffects(stats, chosen.effects);
    trace.push({ questionId: question.id, answerIds: shown.map((answer) => answer.id), chosenAnswerId: chosen.id });
  }
  return { stats, trace };
}
```

`weightedPick` utilise le même RNG et choisit une réponse parmi les trois affichées selon `selectionWeight ?? 1`. `applyEffects` clamp chaque stat dans `0..100`.

- [ ] **Step 4: Vérifier la parité**

Run: `node simulation/validateSamplingParity.mjs`
Expected: PASS.

- [ ] **Step 5: Ajouter le script workspace**

```json
"validate-sampling": "node validateSamplingParity.mjs"
```

- [ ] **Step 6: Commit**

```bash
git add simulation
git commit -m "refactor: partager le sampling des simulations"
```

---

### Task 10: Créer et régénérer les baselines canoniques

**Files:**
- Create: `simulation/buildMatchBaselines.mjs`
- Modify: `src/data/matchBaselines.json`
- Modify: `simulation/package.json`
- Modify: `package.json`

**Interfaces:**
- Consumes: `loadCanonicalContent`, `simulateStats`.
- Produces: un unique `matchBaselines.json` couvrant 550 entrées non-alignement.

- [ ] **Step 1: Vérifier le RED de couverture**

Run: `npm run content:validate`
Expected: FAIL sur les baselines manquantes des nouvelles entrées.

- [ ] **Step 2: Implémenter le générateur déterministe**

```js
const SAMPLES = Math.max(10_000, Number(process.env.BASELINE_SAMPLES ?? 100_000));
const rng = mulberry32(0xBA5E11E5);
```

Pour chaque run, simuler les stats puis calculer la distance brute vers toutes les entrées de chaque groupe. Pour chaque ID accumuler `count`, `sum`, `sumSquares`, puis :

```js
const mean = sum / count;
const variance = Math.max(0, sumSquares / count - mean * mean);
const std = Math.sqrt(variance);
```

Rejeter toute baseline avec `std <= 0` ou valeur non finie.

- [ ] **Step 3: Générer le fichier**

```bash
BASELINE_SAMPLES=100000 npm run sim:build-baselines
```

Expected: message `Match baselines OK: 100000 simulations, 550 entries`.

- [ ] **Step 4: Vérifier contenu et types**

```bash
npm run content:validate
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add simulation/buildMatchBaselines.mjs src/data/matchBaselines.json simulation/package.json package.json
git commit -m "feat: régénérer les baselines canoniques"
```

---

### Task 11: Refaire la calibration d’apparition sur 200 000 parties

**Files:**
- Modify: `simulation/buildAppearanceCalibration.mjs`
- Modify: `src/data/appearanceCalibration.json`
- Create: `content-pipeline/scripts/compareCalibration.mjs`
- Modify: `content-pipeline/scripts/validateSynergyCoverage.mjs`
- Modify: `.github/workflows/qualite.yml`

**Interfaces:**
- Consumes: sampling partagé + baselines canoniques.
- Produces: calibration normalisée pour 559 composants incluant 9 alignements ; rapport de fréquence des synergies.

- [ ] **Step 1: Refactorer le simulateur vers les modules partagés**

Supprimer la sélection locale dupliquée et utiliser :

```js
const { stats } = simulateStats({ questions: content.questions, rng });
```

Puis matcher les huit composants avec les baselines finales.

- [ ] **Step 2: Fixer la cible par défaut à 200 000**

```js
const SAMPLES = Math.max(2_000, Number(process.env.APPEARANCE_SAMPLES ?? 200_000));
const rng = mulberry32(0xF1A1F04D);
```

- [ ] **Step 3: Émettre un rapport de fréquence de synergies**

Écrire dans `SYNERGY_OUTPUT ?? simulation/synergyFrequency.json` :

```json
{
  "synergy_controlled_improviser": {
    "matches": 1842,
    "samples": 200000,
    "frequency": 0.00921
  }
}
```

- [ ] **Step 4: Générer la calibration versionnée**

```bash
APPEARANCE_SAMPLES=200000 npm run sim:build-appearance
```

Expected: `Appearance calibration OK: 200000 simulations, 150 questions`.

- [ ] **Step 5: Valider les synergies**

Run: `npm run synergy:validate`
Expected: PASS.

- [ ] **Step 6: Créer `compareCalibration.mjs`**

Le script reçoit deux chemins en arguments, parse les JSON, compare leurs structures avec `assert.deepEqual` et affiche `Calibration versionnée conforme` en cas de succès.

- [ ] **Step 7: Mettre la CI à 200 000 simulations**

```yaml
- name: Vérifier la calibration d'apparition
  run: |
    APPEARANCE_OUTPUT=/tmp/appearanceCalibration.json SYNERGY_OUTPUT=/tmp/synergyFrequency.json APPEARANCE_SAMPLES=200000 npm run sim:build-appearance
    node content-pipeline/scripts/compareCalibration.mjs src/data/appearanceCalibration.json /tmp/appearanceCalibration.json
    SYNERGY_REPORT=/tmp/synergyFrequency.json npm run synergy:validate
```

Ajouter aussi `npm run validate-sampling -w simulation` avant les simulations.

- [ ] **Step 8: Commit**

```bash
git add simulation src/data/appearanceCalibration.json .github/workflows/qualite.yml content-pipeline/scripts
git commit -m "feat: recalibrer les apparitions sur 200000 parties"
```

---

### Task 12: Supprimer le legacy, documenter et vérifier l’ensemble

**Files:**
- Delete: `src/data/questions.json`
- Delete: `src/data/questions.expansion.json`
- Delete: `src/data/questions.extra.json`
- Delete: `src/data/questions.more.work.json`
- Delete: `src/data/questions.more.social.json`
- Delete: `src/data/questions.more.life.json`
- Delete: `src/data/careers.expansion.json`
- Delete: `src/data/classes.expansion.json`
- Delete: `src/data/powers.expansion.json`
- Delete: `src/data/weaknesses.expansion.json`
- Delete: `src/data/abilities.expansion.json`
- Delete: `src/data/workStyles.expansion.json`
- Delete: `src/data/animals.expansion.json`
- Delete: `src/data/results.extra.json`
- Delete: `src/data/synergyRules.extra.json`
- Delete: `src/data/synergyRules.expansion.json`
- Delete: `src/data/matchBaselines.extra.json`
- Delete: `src/data/matchBaselines.expansion.json`
- Delete if unreferenced: `src/data/rarityDistribution.json`
- Delete if unreferenced: `src/engine/result/computeRarity.ts`
- Modify: `src/data/CONTENT_GUIDE.md`
- Modify: `package.json`

**Interfaces:**
- Produces: structure finale conforme au spec, sans dépendance legacy.

- [ ] **Step 1: Rechercher toutes les références legacy**

```bash
grep -R -nE 'questions\.(extra|expansion)|questions\.more|results\.extra|\.expansion\.json|synergyRules\.extra|matchBaselines\.(extra|expansion)|rarityDistribution' src simulation content-pipeline package.json .github || true
```

Expected avant nettoyage: uniquement les références à supprimer ou au manifest historique.

- [ ] **Step 2: Supprimer les références et fichiers devenus inutiles**

Conserver `legacy-content-manifest.json` et son validateur : ils prouvent que la migration n’a rien perdu. Supprimer `rarityDistribution.json` et `computeRarity.ts` seulement si la recherche et le graphe d’imports confirment qu’ils n’ont plus de consommateur.

- [ ] **Step 3: Mettre à jour `CONTENT_GUIDE.md`**

Documenter exactement :

```text
questions/work.json        30
questions/social.json      30
questions/life.json        30
questions/personality.json 30
questions/general.json     30
careers.json              100
classes.json               75
powers.json                75
weaknesses.json            75
abilities.json             75
workStyles.json            75
animals.json               75
alignments.json             9
synergyRules.json       90-110
```

Documenter aussi l’ordre de régénération : `sim:build-baselines` puis `sim:build-appearance`.

- [ ] **Step 4: Vérifier la migration historique**

Run: `npm run content:validate-migration`
Expected: PASS.

- [ ] **Step 5: Exécuter toutes les validations**

```bash
npm run content:validate
npm run rarity:validate
SYNERGY_REPORT=simulation/synergyFrequency.json npm run synergy:validate
npm run validate-sampling -w simulation
npm run typecheck
npm run build
```

Expected: toutes les commandes PASS.

- [ ] **Step 6: Vérifier les volumes finaux**

Run: `node content-pipeline/scripts/validateContent.mjs`
Expected log :

```text
Content OK: questions=150, answers=1500, careers=100, classes=75, powers=75, weaknesses=75, abilities=75, workStyles=75, animals=75, alignments=9
```

- [ ] **Step 7: Vérifier la reproductibilité finale**

```bash
APPEARANCE_OUTPUT=/tmp/appearanceCalibration.json SYNERGY_OUTPUT=/tmp/synergyFrequency.json APPEARANCE_SAMPLES=200000 npm run sim:build-appearance
node content-pipeline/scripts/compareCalibration.mjs src/data/appearanceCalibration.json /tmp/appearanceCalibration.json
SYNERGY_REPORT=/tmp/synergyFrequency.json npm run synergy:validate
```

Expected: calibration identique et synergies valides.

- [ ] **Step 8: Commit final de nettoyage**

```bash
git add -A
git commit -m "refactor: finaliser la structure canonique du contenu"
```

- [ ] **Step 9: Vérification GitHub Actions**

Pousser la branche / mettre à jour la PR, puis ne considérer la refonte terminée que lorsque `Qualité du quiz` confirme : migration, contenu, sampling, baselines, calibration 200k, synergies, rareté, typecheck et build verts.
