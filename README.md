# Final Form Quiz — Monorepo

Moteur fonctionnel du concept (20 questions tirées d'un pool de 30, 15 stats,
stats dérivées, synergies pondérées, Career/Class/Power/Weakness/Ability/WorkStyle/
Animal/Alignment/Aura/Threat/Worth/Rarity).

**Aucune dépendance API/LLM nulle part**, y compris dans le pipeline de contenu :
la base d'authoring utilise `node:sqlite` (natif, expérimental) et tout le contenu
est écrit/édité à la main.

## Contenu actuel

38 questions · 34 métiers · 13 classes · 9 animaux · 11 pouvoirs · 12 faiblesses ·
12 capacités · 13 styles de travail · 9 alignements · 22 règles de synergie.

**Métiers** : liste curatée à la demande (10 réalistes/connus + 12 particuliers
+ 12 absurdes, remplace l'ancienne liste plus large). **Ton révisé vers une
escalade "troll" plus poussée** dans les réponses de question — voir
`src/data/CONTENT_GUIDE.md` section 8 pour la grille de ratios et l'exemple
canonique (`q_boss_wants_to_talk`). L'absurde reste toujours ancré dans le réel,
jamais de science-fiction ni de pouvoirs surnaturels.

Équilibrage vérifié par simulation (20 000+ profils) : tous les métiers, animaux
et classes sortent avec des fréquences raisonnables (aucun résultat ne domine),
le score de rareté varie en continu (voir "Rareté" plus bas).

## Structure

```
tsconfig.json / tsconfig.app.json / tsconfig.node.json  → config TS (pattern Vite officiel)
vite.config.ts, index.html                              → config du site
src/
  engine/         → Moteur pur (scoring, derivedStats, synergy, selection, result)
  data/           → JSON de contenu + matchBaselines.json + rarityDistribution.json
  styles/theme.css → Design tokens (Japandi × Pop Art)
  ui/, state/, i18n/ → Composants React, hook de pilotage du quiz, i18n

packages/shared-types/ → Types partagés entre engine, content-pipeline et simulation

content-pipeline/     → Outil d'authoring local (jamais servi en prod)
  schema.sql           → Schéma de la base sqlite locale
  scripts/seed.ts       → Bootstrap : lit src/data/*.json → sqlite
  scripts/exportToJson.ts → sqlite → src/data/*.json
  scripts/validateContent.ts → Vérifie cohérence (10 réponses/question, stats valides, etc.)

simulation/           → Équilibrage (section 27 du concept)
  runSimulation.ts           → Fait tourner N profils aléatoires, rapporte les fréquences
  buildRarityDistribution.ts → Génère la vraie table de rareté par percentile
  buildMatchBaselines.ts     → Génère les baselines du matching normalisé
```

## Installer

```bash
npm install
```

## Lancer le site

```bash
npm run dev
npm run build      # tsc -b (typecheck) + vite build
npm run preview    # sert le build de prod en local
```

## Internationalisation

La langue est détectée automatiquement depuis le navigateur au chargement
(`src/i18n/detectLocale.ts`) — aucune action requise de l'utilisateur. Le
sélecteur manuel (EN/FR/ES) n'apparaît qu'à la toute fin, sur l'écran de
résultat, pour ne pas distraire pendant le quiz.

Tout le texte affiché à l'utilisateur passe par le système de traduction :
`src/i18n/useTranslation.ts` (`useTranslation` pour les libellés d'interface,
`useStatLabel` pour les 15 stats — ne jamais afficher une clé technique brute
comme `emotionalControl` directement).

## Matching normalisé (important, lire avant de toucher au contenu)

Le moteur ne choisit **pas** le métier/classe/animal/pouvoir/faiblesse/capacité/
style de travail le plus proche par simple distance brute au profil idéal — ça
favorise systématiquement les profils idéaux proches de la neutralité, peu
importe la pertinence réelle (vérifié : un métier "modéré" sortait à 60%+,
pendant que Docteur ou Avocat n'apparaissaient presque jamais).

À la place, chaque distance est comparée à sa **distribution réelle** (moyenne +
écart-type) calculée sur une grande simulation de vrais profils de joueurs — un
score-z, pas une distance brute. Baselines dans `src/data/matchBaselines.json`.

**À chaque ajout/modification significative de contenu, régénérer :**

```bash
npm run sim:build-baselines        # 50 000 profils par défaut
npm run content:seed
```

## Rareté (score continu, plus de stagnation)

Le score de rareté combine deux composantes :
1. Les règles de synergie déclenchées (`src/data/synergyRules.json`, 16 règles).
2. Un **score continu de "singularité statistique"**
   (`src/engine/synergy/computeExtremityScore.ts`) qui mesure à quel point le
   profil s'écarte globalement de la neutralité sur les 15 stats, indépendamment
   de toute règle nommée.

Sans la composante continue, ~99% des profils obtenaient un score de 0 (aucune
règle de synergie ne se déclenche pour la plupart des profils) et se
retrouvaient tous au même palier de rareté. Avec elle, la distribution s'étale
naturellement (vérifié : min 0.68, p50 3.0, p90 4.3, p99 16.1, max 45.6 sur
20 000 profils).

**À régénérer après tout changement significatif du contenu :**

```bash
npm run sim:build-rarity           # régénère src/data/rarityDistribution.json
```

## Pipeline de contenu (aucune API)

> 📖 **Avant d'ajouter du contenu (à la main ou via une IA générative)**, lire
> `src/data/CONTENT_GUIDE.md` — schéma exact de chaque fichier JSON, règles
> éditoriales, barème des scores de rareté, et un prompt prêt à l'emploi pour
> générer du contenu supplémentaire qui passe la validation du premier coup.

> ⚠️ La base `content-pipeline/data/authoring.sqlite` n'est **pas livrée** dans le
> dépôt. Après un `git clone` ou une extraction fraîche, lance d'abord
> `npm run content:seed` pour la recréer à partir des JSON existants.

1. `npm run content:seed` (une fois, après clone/extraction).
2. Éditer les JSON dans `src/data/*.json`, puis relancer `npm run content:seed`.
   (Ou éditer la base sqlite directement, puis `npm run content:export`.)
3. `npm run content:validate` après chaque édition.
4. Si l'édition change significativement le contenu :
   `npm run sim:build-baselines` puis `npm run sim:build-rarity`.

```bash
npm run content:seed
npm run content:export
npm run content:validate
npm run sim:run                # 20 000 profils par défaut, rapport dans simulation/reports/
npm run sim:build-rarity
npm run sim:build-baselines
```

## Direction visuelle : Japandi × Pop Art

Tokens dans `src/styles/theme.css` :

- **Palette** (aplats uniquement, aucun dégradé) : papier crème `#F4EEE2`, encre
  `#1C1A18`, moutarde `#E8A93B`, coquelicot `#A82F1C` (contraste WCAG AA vérifié :
  5.9:1 avec le texte crème), cobalt `#2E5090`, mousse `#6B7A4F`.
- **Typo** : `Archivo Black` pour les titres, `Work Sans` pour le corps,
  `IBM Plex Mono` pour les nombres/stats.
- **Cartes** : contour encre 2px + ombre plate décalée (façon case de BD).
- **Signature** : badge Rareté en "burst" à trame de points façon halftone BD.
- **Progression** : points façon pellicule (`Q04 / 30`), vraie séquence donc
  numérotation légitime.

Pas de capture d'écran automatisée possible dans cet environnement (pas de
navigateur headless) : `npm run dev` pour juger du rendu réel.

## Ce qui est fait

- [x] Moteur complet : 15 stats, 7 stats dérivées, 16 règles de synergie,
      sélection pondérée (20 questions parmi 30, 3 réponses parmi 10)
- [x] Career, Class, Power, Weakness, Ability, **WorkStyle** (nouveau), Animal —
      tous en **matching normalisé par score-z**
- [x] Alignment (2 axes), Aura, Threat Level, **Life Expectancy affichée**, Worth,
      **Rareté en score continu** (ne stagne plus)
- [x] Pipeline de contenu local (sqlite, sans API) : seed / export / validate
- [x] Simulateur d'équilibrage + générateur de table de rareté + générateur de baselines
- [x] UI complète, direction visuelle Japandi × Pop Art, i18n EN/FR/ES avec
      auto-détection navigateur et sélecteur en fin de parcours uniquement
- [x] Aucun texte d'interface codé en dur (audit fait : Alignment, tagline et
      libellés de stats étaient les 3 oublis, corrigés)

## Ce qu'il reste à faire

- [ ] Scaler encore le contenu (37 → 200 questions) pour une vraie rejouabilité
      à grande échelle — voir `src/data/CONTENT_GUIDE.md` pour générer ça avec
      une IA en respectant le schéma exact
- [ ] Millionnaires/milliardaires (`Worth`) n'apparaissent toujours pas sur
      20 000 simulations — probabilités à recalibrer
- [ ] Générateur de share card exportable en image (1080×1350 / 1080×1920)
- [ ] Un vrai outil d'édition du contenu au-delà de l'édition brute JSON/sqlite
- [ ] Déploiement Cloudflare Pages
