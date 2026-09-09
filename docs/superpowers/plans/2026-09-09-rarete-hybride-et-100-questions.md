# Rareté hybride et 100 questions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Porter le quiz à 100 questions / 1 000 réponses et remplacer les paliers de rareté par une rareté hybride granulaire fondée sur l’occurrence du profil, les synergies et l’extrémité statistique.

**Architecture:** Une calibration d’apparition versionnée fournit une probabilité par résultat et par catégorie. Le runtime combine la rareté structurelle dérivée de ces probabilités avec un multiplicateur comportemental calculé à partir des synergies et de l’extrémité, puis borne et arrondit le `1/X`. Un script de simulation reproductible permet de reconstruire la calibration après évolution du contenu.

**Tech Stack:** React 18, TypeScript 5, Vite 6, Node.js 24 dans CI, JSON versionné, scripts ESM `.mjs`.

**Spec:** `docs/superpowers/specs/2026-09-09-rarete-hybride-et-100-questions.md`

## Global Constraints
- Le pool doit atteindre 100 questions et 1 000 réponses, sans changer les 20 questions jouées par partie ni les 3 réponses visibles.
- Toutes les nouvelles chaînes sont localisées EN/FR/ES.
- La rareté affichée reste entre `1/25` et `1/1 000 000 000`.
- Les anciennes données restent compatibles et les calculs restent déterministes avec le seed existant.
- Chaque résultat sélectionnable doit disposer d’une calibration d’apparition strictement positive.

---

### Task 1: Contrats de rareté hybride

**Files:**
- Modify: `packages/shared-types/src/index.ts`
- Create: `src/engine/result/computeHybridRarity.ts`
- Modify: `src/engine/result/index.ts`
- Modify: `src/engine/computeFinalForm.ts`

**Interfaces:**
- Produces `AppearanceCalibration`, `RarityBreakdown` et une fonction `computeHybridRarity(input)`.
- `computeFinalForm` reçoit `appearanceCalibration` en option requise de production et expose le détail dans `FinalForm.rarity`.

- [ ] **Step 1: Écrire un test/validateur qui exige une rareté bornée et sensible à la fréquence**

Créer un petit script de test Node/TypeScript ou étendre un test existant afin de vérifier qu’un profil avec probabilités plus faibles produit un `oneInX` supérieur à un profil fréquent, à synergies identiques.

- [ ] **Step 2: Vérifier l’échec RED**

Run: `npm run typecheck` ou le test ciblé ajouté.
Expected: FAIL car `computeHybridRarity` / les nouveaux types n’existent pas encore.

- [ ] **Step 3: Implémenter le calcul minimal**

Le calcul doit :
```ts
const probabilities = [career, class, power, weakness, ability, workStyle, animal, alignment];
const geometricMean = Math.exp(probabilities.reduce((sum, p) => sum + Math.log(p), 0) / probabilities.length);
const appearanceOneInX = 1 / geometricMean;
const behavioralMultiplier = 1 + synergyScore / 20 + extremityScore / 40;
const rawOneInX = appearanceOneInX * behavioralMultiplier;
const oneInX = roundReadable(clamp(rawOneInX, 25, 1_000_000_000));
```
Le détail doit inclure `appearanceOneInX`, `synergyScore`, `extremityScore`, `behavioralMultiplier`.

- [ ] **Step 4: Vérifier GREEN**

Run: `npm run typecheck && npm run build`
Expected: PASS pour le moteur modifié.

- [ ] **Step 5: Commit**

Commit: `feat: calculer une rareté hybride granulaire`

---

### Task 2: Calibration d’apparition versionnée

**Files:**
- Create: `src/data/appearanceCalibration.json`
- Modify: `src/data/index.ts`
- Modify: `content-pipeline/scripts/validateContent.mjs`

**Interfaces:**
- `appearanceCalibration` est exporté depuis `src/data/index.ts`.
- Structure par catégorie : `{ careers: Record<string, number>, ... alignments: Record<string, number> }`.

- [ ] **Step 1: Étendre le validateur avant les données**

Le validateur doit exiger une probabilité finie `> 0` pour chaque ID de `careers/classes/powers/weaknesses/abilities/workStyles/animals/alignments`, et vérifier que la somme d’une catégorie est comprise entre `0.999` et `1.001`.

- [ ] **Step 2: Vérifier RED**

Run: `npm run content:validate`
Expected: FAIL car `appearanceCalibration.json` est absent.

- [ ] **Step 3: Ajouter la calibration initiale**

Construire une calibration normalisée couvrant tous les IDs existants. Les valeurs doivent être non uniformes afin que les profils courants et rares produisent des `1/X` différents.

- [ ] **Step 4: Raccorder le runtime**

Importer et exporter la calibration dans `src/data/index.ts`, puis la passer à `computeFinalForm` depuis `useQuizEngine`.

- [ ] **Step 5: Vérifier GREEN**

Run: `npm run content:validate && npm run typecheck && npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

Commit: `feat: ajouter la calibration d’apparition`

---

### Task 3: Script de recalibration par simulation

**Files:**
- Create: `simulation/buildAppearanceCalibration.mjs`
- Modify: `simulation/package.json`
- Modify: root `package.json`

**Interfaces:**
- Script root: `npm run sim:build-appearance`
- Écrit `src/data/appearanceCalibration.json`.

- [ ] **Step 1: Ajouter le script avant son implémentation**

Ajouter `"build-appearance": "node buildAppearanceCalibration.mjs"` au workspace simulation et `"sim:build-appearance": "npm run build-appearance -w simulation"` au root.

- [ ] **Step 2: Vérifier RED**

Run: `npm run sim:build-appearance`
Expected: FAIL car `buildAppearanceCalibration.mjs` n’existe pas encore.

- [ ] **Step 3: Implémenter le simulateur**

Le script doit :
- charger les questions et les résultats réellement fusionnés,
- générer un grand échantillon de parties reproductibles,
- tirer 20 questions et 3 réponses visibles, puis une réponse choisie selon les poids,
- reproduire le calcul des stats et des matchers,
- compter chaque résultat,
- ajouter un lissage de Laplace `+1`,
- normaliser les fréquences par catégorie,
- écrire le JSON trié et stable.

- [ ] **Step 4: Vérifier la sortie**

Run: `npm run sim:build-appearance && npm run content:validate`
Expected: PASS et fichier JSON valide.

- [ ] **Step 5: Commit**

Commit: `feat: simuler les fréquences d’apparition`

---

### Task 4: Extension à 100 questions / 1 000 réponses

**Files:**
- Create: `src/data/questions.more.json`
- Modify: `src/data/index.ts`
- Modify: `content-pipeline/scripts/validateContent.mjs`

**Interfaces:**
- `questions.more.json` contient exactement 30 questions de 10 réponses.
- Le `ContentPack` fusionne base + expansion + extra + more.

- [ ] **Step 1: Monter les seuils du validateur**

Le validateur exige `questions.length >= 100` et `answersTotal >= 1000`.

- [ ] **Step 2: Vérifier RED**

Run: `npm run content:validate`
Expected: FAIL avec `70` questions / `700` réponses.

- [ ] **Step 3: Ajouter 30 questions localisées**

Chaque question doit avoir 10 réponses EN/FR/ES et des effets couvrant les 15 stats sans créer des profils systématiquement extrêmes. Répartir les thèmes entre travail, social, argent, technologie, stress, énergie, créativité, décisions et chaos quotidien.

- [ ] **Step 4: Fusionner le nouveau fichier**

Ajouter `questionsMoreRaw` dans `src/data/index.ts` et `questions.more` dans le validateur.

- [ ] **Step 5: Vérifier GREEN**

Run: `npm run content:validate`
Expected: `questions=100, answers=1000`.

- [ ] **Step 6: Commit**

Commit: `feat: porter le quiz à 100 questions`

---

### Task 5: UI du détail de rareté

**Files:**
- Modify: `src/components/FinalFormCard.tsx`
- Modify: `src/styles/theme.css`

**Interfaces:**
- Utilise `result.rarity.appearanceOneInX`, `result.rarity.synergyScore`, `result.rarity.extremityScore`.

- [ ] **Step 1: Ajouter le rendu détaillé**

Dans le panneau d’analyse complète, afficher trois cellules compactes : `Occurrence du profil`, `Synergies`, `Extrémité` avec traductions EN/FR/ES.

- [ ] **Step 2: Ajouter le style**

Réutiliser la grille et les cartes existantes sans surcharger la révélation principale.

- [ ] **Step 3: Vérifier**

Run: `npm run typecheck && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

Commit: `feat: expliquer la rareté finale`

---

### Task 6: Vérification finale

**Files:**
- No production changes unless verification reveals a defect.

- [ ] **Step 1: Validation contenu complète**

Run: `npm run content:validate`
Expected: `questions=100`, `answers=1000`, toutes les catégories valides.

- [ ] **Step 2: TypeScript**

Run: `npm run typecheck`
Expected: exit 0.

- [ ] **Step 3: Build production**

Run: `npm run build`
Expected: exit 0.

- [ ] **Step 4: Vérifier la CI GitHub Actions**

La workflow `Qualité du quiz` doit finir avec `Validation contenu`, `Vérifier les types` et `Construire l'application` en succès.
