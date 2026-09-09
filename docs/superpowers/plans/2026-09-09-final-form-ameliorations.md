# Final Form Quiz — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre Final Form Quiz plus fiable, plus drôle, plus varié et plus partageable.

**Architecture:** Les données restent pilotées par JSON et validées au chargement. L'UI finale consomme les mêmes identifiants de `FinalForm`, mais ajoute une couche de présentation locale pour les verdicts, badges et niveaux de rareté sans modifier le moteur de score.

**Tech Stack:** React 18, TypeScript, Vite, JSON, CSS.

**Spec:** `docs/superpowers/specs/2026-09-09-final-form-ameliorations-design.md`

## Global Constraints
- EN/FR/ES pour tout nouveau texte visible.
- Exactement neuf alignements couvrant la grille 3×3.
- Aucun pouvoir surnaturel : absurdité réaliste uniquement.
- Conserver les 15 statistiques et le calcul actuel de rareté.
- Commits Git en français.

---

### Task 1: Sécuriser les alignements
**Files:**
- Modify: `src/data/alignments.json`
- Modify: `src/data/results.extra.json`
- Modify: `src/data/index.ts`

- [ ] Supprimer les alignements supplémentaires qui chevauchent la grille canonique.
- [ ] Ajouter une validation `min <= max` sur chaque axe.
- [ ] Exiger exactement neuf alignements.
- [ ] Vérifier les neuf cellules attendues de la grille.
- [ ] Commit: `fix: sécuriser la grille des alignements`.

### Task 2: Enrichir et nettoyer le contenu
**Files:**
- Modify: `src/data/results.extra.json`
- Modify: `src/data/weaknesses.json` si nécessaire
- Modify: `src/data/matchBaselines.extra.json` après recalcul disponible

- [ ] Remplacer le pouvoir télépathique par une capacité réaliste.
- [ ] Ajouter plusieurs carrières, classes, animaux, pouvoirs, faiblesses, capacités et styles de travail EN/FR/ES.
- [ ] Corriger les formulations ou doublons évidents.
- [ ] Vérifier les profils 0..100 et les IDs uniques.
- [ ] Commit: `feat: enrichir les résultats humoristiques`.

### Task 3: Varier l'écran d'analyse
**Files:**
- Modify: `src/ui/result/AnalyzingScreen.tsx`

- [ ] Créer un pool localisé de messages sérieux, particuliers et absurdes.
- [ ] Sélectionner une séquence variable sans modifier la durée globale de façon excessive.
- [ ] Garder la progression accessible et stable pendant un rendu.
- [ ] Commit: `feat: rendre l'analyse plus vivante`.

### Task 4: Renforcer la révélation finale
**Files:**
- Modify: `src/ui/result/FinalFormCard.tsx`
- Modify: `src/styles/theme.css`

- [ ] Ajouter un verdict déterministe dérivé des statistiques fortes/faibles.
- [ ] Ajouter des labels de rareté localisés et une mise en scène croissante.
- [ ] Présenter d'abord classe, rareté et combinaison humoristique.
- [ ] Transformer les tags de synergie en badges lisibles.
- [ ] Mettre statistiques, dérivées et ID dans un panneau de détails repliable.
- [ ] Ajouter partage natif avec repli presse-papiers et retour utilisateur.
- [ ] Adapter les titres longs et la grille au mobile.
- [ ] Commit: `feat: transformer la révélation finale`.

### Task 5: Vérification d'intégration
**Files:** aucun fichier de production requis.

- [ ] Exécuter ou vérifier la CI pour `npm run content:validate`.
- [ ] Exécuter ou vérifier la CI pour `npm run typecheck`.
- [ ] Exécuter ou vérifier la CI pour `npm run build`.
- [ ] Inspecter les diffs et corriger toute régression détectée avant de conclure.