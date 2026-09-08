# Stabilisation du moteur du quiz — Plan d'implémentation

> **Pour les agents d'exécution :** utiliser `superpowers:subagent-driven-development` ou `superpowers:executing-plans` pour exécuter ce plan tâche par tâche, avec vérification après chaque étape.

**Objectif :** rendre le moteur du quiz déterministe, validé, borné et reproductible avant d'ajouter les fonctionnalités virales et les raffinements UI.

**Architecture :** conserver la séparation React → state → engine → data. Le contenu reste dans les JSON, les outils `content-pipeline` et `simulation` restent offline, et le navigateur ne reçoit que les artefacts nécessaires au runtime. Les invariants du moteur seront validés avant le build et protégés par CI.

**Tech Stack :** React 18, TypeScript 5, Vite 6, Node.js >= 20, npm workspaces, scripts Node ESM.

**Spec :** `docs/superpowers/specs/2026-09-09-frontend-engine-data-redesign.md`

## Contraintes globales

- Production 100 % frontend/statique : aucun backend requis pour le moteur.
- Les simulations et pipelines de contenu ne doivent jamais être importés par le runtime navigateur.
- Les stats publiques restent dans `0..100` et les scores dérivés dans leurs plages documentées.
- Une partie produit exactement 20 questions et affiche exactement 3 réponses par question.
- Une partie est reproductible à partir de son seed.
- Les données invalides doivent échouer explicitement avant le build/runtime.
- Les commits de cette branche décrivent en français le changement réalisé.

---

## Tâche 1 — Stabiliser les garde-fous du contenu

**Fichiers :**
- Modifier : `content-pipeline/scripts/validateContent.mjs`
- Modifier : `src/data/index.ts`

**But :** valider les clés de statistiques, les bornes des profils, les baselines et la distribution de rareté avant qu'une donnée incohérente n'atteigne le moteur.

- [ ] Vérifier que chaque clé d'effet appartient à `STAT_KEYS`.
- [ ] Vérifier que les profils n'utilisent que des stats connues.
- [ ] Vérifier que chaque baseline a un `mean` et un `std` finis, avec `std > 0`.
- [ ] Vérifier que la table de rareté est triée par `minScore` croissant et `oneInX` croissant.
- [ ] Exécuter la validation et confirmer qu'une donnée volontairement invalide est rejetée.
- [ ] Commit : `fix: renforcer la validation des données du quiz`.

## Tâche 2 — Garantir les contrats mathématiques

**Fichiers :**
- Modifier : `src/engine/derivedStats/weightedMix.ts`
- Modifier : `src/engine/result/profileMatch.ts`
- Modifier : `src/engine/result/computeRarity.ts`
- Modifier si nécessaire : `src/engine/computeFinalForm.ts`

**But :** empêcher `NaN`, `Infinity` et les sorties hors plage.

- [ ] Tester les poids positifs et négatifs de `weightedMix`.
- [ ] Tester les stats non finies et les poids non finis.
- [ ] Refuser une baseline invalide plutôt que mélanger score brut et z-score dans la même comparaison.
- [ ] Garantir une rareté finie avec un fallback explicite.
- [ ] Vérifier que les scores publics sont bornés.
- [ ] Exécuter `npm run build`.
- [ ] Commit : `fix: borner les calculs statistiques du moteur`.

## Tâche 3 — Garantir une partie reproductible

**Fichiers :**
- Modifier : `src/state/useQuizEngine.ts`
- Modifier : `src/engine/game/random.ts`
- Modifier : `src/engine/game/formId.ts`
- Modifier : `src/engine/selection/selectQuestions.ts`
- Modifier : `src/engine/selection/selectAnswers.ts`

**But :** un seed doit produire exactement la même partie, tandis que `Try Again` doit créer un nouveau seed.

- [ ] Utiliser un RNG dérivé du seed pour questions et réponses.
- [ ] Garantir exactement 20 questions ou échouer explicitement.
- [ ] Garantir exactement 3 réponses ou échouer explicitement.
- [ ] Respecter `selectionWeight` des réponses.
- [ ] Vérifier l'absence de doublons de questions.
- [ ] Vérifier que `reset()` régénère seed, questions et réponses.
- [ ] Commit : `fix: rendre les parties du quiz déterministes et rejouables`.

## Tâche 4 — Ajouter la qualité automatisée

**Fichiers :**
- Créer : `.github/workflows/qualite.yml`
- Modifier : `package.json`

**But :** empêcher une régression de fusionner sans validation du contenu et du build.

- [ ] Ajouter `typecheck` et `quality` aux scripts npm.
- [ ] Faire tourner `npm ci`, validation du contenu, typecheck et build dans GitHub Actions.
- [ ] Ne pas lancer les outils offline de simulation dans le navigateur.
- [ ] Commit : `ci: ajouter la validation automatique du quiz`.

## Tâche 5 — Améliorer le résultat partageable

**Fichiers :**
- Modifier : `src/components/FinalFormCard.*`
- Modifier : `index.html`
- Modifier : les types partagés si nécessaire

**But :** exposer au joueur les informations déjà calculées par le moteur et préparer le partage.

- [ ] Afficher l'Ability et les informations de synergie utiles.
- [ ] Afficher le Form ID lorsque disponible.
- [ ] Ajouter les métadonnées Open Graph de base.
- [ ] Ne pas introduire de backend pour le partage.
- [ ] Commit : `feat: enrichir le résultat et préparer le partage`.

## Tâche 6 — Vérification finale

- [ ] `npm ci`
- [ ] `npm run content:validate`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] Vérifier le diff de la branche par rapport à `main`.
- [ ] Vérifier qu'aucun secret ou artefact local n'est ajouté.
- [ ] Ouvrir une PR vers `main` avec résumé des corrections et limites restantes.

## Ordre de livraison

1. Validation des données.
2. Contrats mathématiques.
3. Reproductibilité et rejouabilité.
4. CI.
5. Résultat partageable.
6. Vérification et PR.
