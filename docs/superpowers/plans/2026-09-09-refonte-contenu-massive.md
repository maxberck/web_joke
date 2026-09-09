# Refonte massive du contenu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrer toutes les données vers une structure canonique simple, porter le quiz à 150 questions / 1 500 réponses et fortement augmenter tous les catalogues de résultats sans casser le gameplay ni la rareté hybride.

**Architecture:** `src/data/index.ts` ne chargera plus aucune source `extra`, `expansion` ou `more`. Les questions seront réparties dans cinq fichiers canoniques, les autres groupes auront un seul JSON chacun, et les simulations de baselines/calibration partageront les vrais sélecteurs du jeu pour rester synchronisées avec le runtime.

**Tech Stack:** TypeScript, React, Vite, Node.js 24 en CI, JSON, scripts ESM `.mjs`, GitHub Actions.

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
- Produces: un snapshot immuable des IDs, catégories et textes historiques ; commande `npm run content:validate-migration`.

- [ ] **Step 1: Écrire le validateur RED avant la nouvelle structure**

Créer `validateCanonicalMigration.mjs` pour exiger les cinq fichiers canoniques et comparer leurs entrées au manifest :

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
}
```

Le manifest doit aussi stocker pour chaque question les IDs et textes de ses 10 réponses, et pour chaque résultat historique son `name/text`, `description`, `idealProfile/lowProfile` et `worthPotential` quand présent.

- [ ] **Step 2: Lancer le validateur et vérifier le RED**

Run:

```bash
node content-pipeline/scripts/validateCanonicalMigration.mjs
```

Expected: FAIL car `src/data/questions/work.json` et les quatre autres fichiers n’existent pas encore.

- [ ] **Step 3: Générer une fois le manifest depuis les sources historiques**

`buildLegacyManifest.mjs` doit fusionner exactement les mêmes sources que le runtime actuel, trier les clés/IDs de manière déterministe et écrire :

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

Expected: fichier `content-pipeline/fixtures/legacy-content-manifest.json` créé avec 100 questions et 239 résultats/alignements couverts selon les catalogues actuels.

- [ ] **Step 4: Ajouter les scripts npm**

Dans `package.json` :

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
- Produces: cinq tableaux JSON de 20 questions historiques chacun, sans aucune modification de contenu.

- [ ] **Step 1: Répartir les 100 questions historiques par thème**

Règle exacte : chaque fichier contient 20 questions historiques. Le classement thématique peut déplacer une question entre fichiers mais ne modifie jamais `id`, `category`, `selectionWeight`, `text`, réponses ou effets.

Chaque fichier est un tableau de cette forme :

```json
[
  {
    "id": "question_id_existant",
    "category": "categorie_historique_inchangee",
    "text": { "en": "...", "fr": "...", "es": "..." },
    "answers": [
      {
        "id": "answer_id_existant",
        "text": { "en": "...", "fr": "...", "es": "..." },
        "effects": { "humor": 4, "chaos": 2 }
      }
    ]
  }
]
```

- [ ] **Step 2: Exécuter le validateur de migration**

Run:

```bash
npm run content:validate-migration
```

Expected: les comparaisons historiques des questions passent ; les groupes de résultats peuvent encore utiliser temporairement les anciennes sources pendant cette étape.

- [ ] **Step 3: Vérifier les volumes intermédiaires**

Run:

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
- Produces: un seul fichier canonique par groupe avec exactement les volumes historiques actuels avant expansion : careers=50, autres grands groupes=30, alignments=9, synergies=45.

- [ ] **Step 1: Fusionner chaque groupe sans modifier les objets**

Ordre canonique à conserver pour limiter le diff : base, puis `results.extra`, puis expansion. Exemple conceptuel pour `careers.json` :

```js
const canonicalCareers = [
  ...careersBase,
  ...resultsExtra.careers,
  ...careersExpansion,
];
```

Écrire le résultat directement dans `careers.json`. Répéter pour classes, powers, weaknesses, abilities, workStyles, animals et synergyRules.

- [ ] **Step 2: Vérifier l’absence de perte historique**

Run:

```bash
npm run content:validate-migration
```

Expected: PASS pour IDs, textes, profils, descriptions et synergies historiques.

- [ ] **Step 3: Vérifier les volumes canoniques historiques**

Run:

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
- Produces: `contentPack`, `matchBaselines`, `appearanceCalibration` sans aucune référence à `extra/expansion/more`.

- [ ] **Step 1: Faire échouer le validateur actuel sur l’absence de références legacy**

Ajouter temporairement dans `validateContent.mjs` :

```js
const forbiddenNames = ["extra", "expansion", "more"];
const dataIndex = await readFile(resolve(root, "src/data/index.ts"), "utf8");
for (const token of forbiddenNames) {
  if (dataIndex.includes(token)) throw new Error(`src/data/index.ts contient encore ${token}`);
}
```

Run:

```bash
npm run content:validate
```

Expected: FAIL tant que `src/data/index.ts` importe les anciennes sources.

- [ ] **Step 2: Simplifier `src/data/index.ts`**

Imports de questions :

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

Les autres groupes sont importés une seule fois et utilisés directement dans `contentPack`. Garder les assertions de profils, alignements, couverture des baselines et couverture de calibration.

- [ ] **Step 3: Remplacer les deux validateurs par un seul validateur canonique**

`validateContent.mjs` doit charger uniquement les nouvelles sources et, à ce stade intermédiaire, accepter 100 questions / volumes historiques. Le passage aux volumes finaux sera activé à Task 8.

Dans `package.json` :

```json
"content:validate": "node content-pipeline/scripts/validateContent.mjs",
"content:validate-migration": "node content-pipeline/scripts/validateCanonicalMigration.mjs"
```

- [ ] **Step 4: Vérifier runtime et types**

Run:

```bash
npm run content:validate-migration
npm run content:validate
npm run typecheck
npm run build
```

Expected: PASS sur les quatre commandes.

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
- Produces: 30 questions par fichier, exactement 10 réponses par question, soit 150 / 1 500.

- [ ] **Step 1: Passer le validateur en RED sur les volumes finaux**

Ajouter :

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

Run:

```bash
npm run content:validate
```

Expected: FAIL avec 20 questions dans chaque fichier.

- [ ] **Step 2: Ajouter exactement 10 nouvelles questions dans chaque fichier**

Pour chacune des 50 nouvelles questions :

```json
{
  "id": "q_descriptive_unique",
  "category": "existing-compatible-category",
  "text": {
    "en": "English prompt",
    "fr": "Question française",
    "es": "Pregunta española"
  },
  "answers": [
    {
      "id": "q_descriptive_unique_a1",
      "text": { "en": "...", "fr": "...", "es": "..." },
      "effects": { "discipline": 4, "chaos": -2 }
    }
  ]
}
```

Exigences d’écriture : 10 réponses distinctes ; pas de traduction manquante ; effets utilisant uniquement les 15 `STAT_KEYS` ; mélange d’effets positifs/négatifs ; pas de question quasi dupliquée.

- [ ] **Step 3: Vérifier les volumes et la migration historique**

Run:

```bash
npm run content:validate-migration
npm run content:validate
```

Expected: PASS ; le manifest confirme que les 100 anciennes questions sont intactes et le validateur confirme 150/1500.

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

Chaque nouveau métier doit avoir :

```json
{
  "id": "career_unique_id",
  "name": { "en": "...", "fr": "...", "es": "..." },
  "idealProfile": { "intelligence": 70, "discipline": 55, "creativity": 65 },
  "worthPotential": { "min": 25000, "max": 180000 }
}
```

Répartir les nouveaux métiers entre sérieux, absurdes et hybrides ; éviter de concentrer tous les profils autour de 50-60.

- [ ] **Step 3: Ajouter 45 classes et 45 pouvoirs**

Forme requise :

```json
{
  "id": "class_or_power_unique_id",
  "name": { "en": "...", "fr": "...", "es": "..." },
  "idealProfile": { "humor": 80, "chaos": 70, "energy": 60 }
}
```

Les 45 nouvelles entrées par groupe doivent couvrir des profils bas, moyens et élevés sur des combinaisons différentes de stats.

- [ ] **Step 4: Vérifier contenu et historique**

Run:

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

Utiliser uniquement `lowProfile` :

```json
{
  "id": "weakness_unique_id",
  "text": { "en": "...", "fr": "...", "es": "..." },
  "lowProfile": { "emotionalControl": 25, "discipline": 30, "social": 40 }
}
```

- [ ] **Step 3: Ajouter 45 capacités et 45 styles de travail**

Chaque entrée utilise `idealProfile`, trois langues et un profil distinct.

- [ ] **Step 4: Ajouter 45 animaux avec descriptions**

Forme :

```json
{
  "id": "animal_unique_id",
  "name": { "en": "...", "fr": "...", "es": "..." },
  "description": { "en": "...", "fr": "...", "es": "..." },
  "idealProfile": { "energy": 65, "social": 35, "luck": 55 }
}
```

- [ ] **Step 5: Vérifier contenu et historique**

Run:

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

- [ ] **Step 1: Ajouter le test RED de volume et de structure**

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

Forme :

```json
{
  "id": "synergy_unique_id",
  "conditions": [
    { "stat": "chaos", "op": ">=", "value": 70 },
    { "stat": "discipline", "op": "<=", "value": 35 }
  ],
  "weight": 1,
  "rarityScore": 6,
  "tags": ["improvised", "volatile"]
}
```

Éviter les conditions logiquement identiques avec seulement un ID différent.

- [ ] **Step 3: Créer `validateSynergyCoverage.mjs`**

Le script reçoit un rapport de fréquence de simulation et échoue seulement pour les règles extrêmes selon ces seuils : fréquence > 0.95 ou fréquence < 0.000005 sur 200 000 runs. Il doit afficher les règles entre 0.000005 et 0.00005 comme avertissement, sans faire échouer.

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

`validateSamplingParity.mjs` doit importer les vrais sélecteurs :

```js
import { selectQuestions, selectAnswers } from "../src/engine/selection/index.ts";
import { loadCanonicalContent } from "./lib/loadCanonicalContent.mjs";
import { simulateStats, mulberry32 } from "./lib/simulateStats.mjs";
```

Avec une seed fixe, le script vérifie que `simulateStats` sélectionne 20 IDs de questions identiques à un appel direct de `selectQuestions`, puis 3 IDs de réponses identiques à `selectAnswers` pour chaque question.

Run:

```bash
node simulation/validateSamplingParity.mjs
```

Expected: FAIL car les modules `simulation/lib/*` n’existent pas.

- [ ] **Step 2: Implémenter `loadCanonicalContent()`**

Retour attendu :

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

Le loader lit uniquement les cinq fichiers de questions et les JSON canoniques.

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
    trace.push({ questionId: question.id, answerIds: shown.map((a) => a.id), chosenAnswerId: chosen.id });
  }
  return { stats, trace };
}
```

- [ ] **Step 4: Vérifier la parité**

Run: `node simulation/validateSamplingParity.mjs`
Expected: PASS avec une seed fixe et 20 tours.

- [ ] **Step 5: Ajouter script npm workspace**

Dans `simulation/package.json` :

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
- Produces: un unique `matchBaselines.json` couvrant 100+75+75+75+75+75+75 = 550 entrées non-alignement.

- [ ] **Step 1: Écrire un contrôle RED de couverture**

Avant génération, lancer :

```bash
npm run content:validate
```

Expected: FAIL sur les baselines manquantes des nouvelles entrées.

- [ ] **Step 2: Implémenter le générateur déterministe**

Constantes :

```js
const SAMPLES = Math.max(10_000, Number(process.env.BASELINE_SAMPLES ?? 100_000));
const rng = mulberry32(0xBA5E11E5);
```

Pour chaque run, simuler les stats puis calculer la distance brute vers toutes les entrées de chaque groupe. Pour chaque ID, accumuler `count`, `sum`, `sumSquares`, puis écrire :

```js
const mean = sum / count;
const variance = Math.max(0, sumSquares / count - mean * mean);
const std = Math.sqrt(variance);
```

Rejeter toute baseline avec `std <= 0` ou non finie.

- [ ] **Step 3: Générer le fichier**

Run:

```bash
BASELINE_SAMPLES=100000 npm run sim:build-baselines
```

Expected: `matchBaselines.json` écrit avec couverture complète et message `Match baselines OK`.

- [ ] **Step 4: Vérifier contenu et types**

Run:

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
- Modify: `.github/workflows/qualite.yml`
- Modify: `content-pipeline/scripts/validateSynergyCoverage.mjs`

**Interfaces:**
- Consumes: sampling partagé + baselines canoniques.
- Produces: calibration normalisée pour 559 composants incluant les 9 alignements ; rapport de fréquence des synergies.

- [ ] **Step 1: Refactorer le simulateur pour utiliser les modules partagés**

Supprimer toute logique locale dupliquée de sélection des questions/réponses. Utiliser :

```js
const { stats } = simulateStats({ questions: content.questions, rng });
```

Puis matcher les 8 composants avec les baselines finales.

- [ ] **Step 2: Fixer la cible par défaut à 200 000**

```js
const SAMPLES = Math.max(2_000, Number(process.env.APPEARANCE_SAMPLES ?? 200_000));
```

Conserver une seed fixe dédiée, par exemple `0xF1A1F04D`.

- [ ] **Step 3: Émettre aussi un rapport de fréquence de synergies**

Écrire `simulation/synergyFrequency.json` ou un fichier temporaire configuré par `SYNERGY_OUTPUT`. Chaque règle contient `matches`, `samples`, `frequency`.

- [ ] **Step 4: Générer la calibration versionnée**

Run:

```bash
APPEARANCE_SAMPLES=200000 npm run sim:build-appearance
```

Expected: `Appearance calibration OK: 200000 simulations, 150 questions`.

- [ ] **Step 5: Valider les synergies**

Run:

```bash
npm run synergy:validate
```

Expected: PASS ; aucune règle >95 % ni <0.0005 % d’occurrence.

- [ ] **Step 6: Mettre la CI à 200 000 simulations avec sortie temporaire**

Étape GitHub Actions :

```yaml
- name: Vérifier la calibration d'apparition
  run: |
    APPEARANCE_OUTPUT=/tmp/appearanceCalibration.json SYNERGY_OUTPUT=/tmp/synergyFrequency.json APPEARANCE_SAMPLES=200000 npm run sim:build-appearance
    node content-pipeline/scripts/compareCalibration.mjs src/data/appearanceCalibration.json /tmp/appearanceCalibration.json
    SYNERGY_REPORT=/tmp/synergyFrequency.json npm run synergy:validate
```

Créer `compareCalibration.mjs` plutôt que conserver un `node -e` massif dans le YAML.

- [ ] **Step 7: Commit**

```bash
git add simulation src/data/appearanceCalibration.json .github/workflows/qualite.yml content-pipeline/scripts
git commit -m "feat: recalibrer les apparitions sur 200000 parties"
```

---

### Task 12: Supprimer le legacy, documenter et effectuer la vérification finale

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
- Modify: `src/data/CONTENT_GUIDE.md`
- Modify: `package.json`
- Test: all project validation scripts

**Interfaces:**
- Produces: structure finale conforme au spec, sans aucune dépendance legacy.

- [ ] **Step 1: Rechercher toutes les références legacy**

Run:

```bash
grep -R -nE 'questions\.(extra|expansion)|questions\.more|results\.extra|\.expansion\.json|synergyRules\.extra|matchBaselines\.(extra|expansion)|rarityDistribution' src simulation content-pipeline package.json .github || true
```

Expected avant nettoyage: quelques références restantes identifiées précisément.

- [ ] **Step 2: Supprimer les références et fichiers devenus inutiles**

`rarityDistribution.json` est supprimé seulement si la recherche confirme qu’aucun calcul/runtime n’en dépend. Si `computeRarity.ts` est alors sans appel, le supprimer également et retirer ses exports.

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

Expliquer qu’après toute modification de profils/questions il faut régénérer les baselines puis la calibration.

- [ ] **Step 4: Exécuter la migration historique**

Run:

```bash
npm run content:validate-migration
```

Expected: PASS — les 100 anciennes questions, leurs réponses, catégories et toutes les entrées historiques sont toujours présentes.

- [ ] **Step 5: Exécuter toutes les validations fonctionnelles**

Run:

```bash
npm run content:validate
npm run rarity:validate
npm run synergy:validate
npm run typecheck
npm run build
```

Expected: toutes les commandes PASS.

- [ ] **Step 6: Vérifier les volumes finaux explicitement**

Run:

```bash
node content-pipeline/scripts/validateContent.mjs
```

Expected log contenant :

```text
Content OK: questions=150, answers=1500, careers=100, classes=75, powers=75, weaknesses=75, abilities=75, workStyles=75, animals=75, alignments=9
```

- [ ] **Step 7: Vérifier la reproductibilité finale de la calibration**

Run:

```bash
APPEARANCE_OUTPUT=/tmp/appearanceCalibration.json SYNERGY_OUTPUT=/tmp/synergyFrequency.json APPEARANCE_SAMPLES=200000 npm run sim:build-appearance
node content-pipeline/scripts/compareCalibration.mjs src/data/appearanceCalibration.json /tmp/appearanceCalibration.json
```

Expected: comparaison identique.

- [ ] **Step 8: Commit final de nettoyage**

```bash
git add -A
git commit -m "refactor: finaliser la structure canonique du contenu"
```

- [ ] **Step 9: Vérification GitHub Actions**

Pousser la branche / mettre à jour la PR, attendre `Qualité du quiz`, puis confirmer que les étapes contenu, calibration 200k, synergies, typecheck et build sont toutes vertes avant toute fusion vers `main`.
