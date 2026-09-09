# Guide du contenu

## Structure canonique

Toutes les données utilisées par le quiz vivent désormais dans une seule structure canonique. Les anciennes couches `extra`, `expansion` et `more` ont été supprimées.

```text
src/data/
  questions/
    work.json
    social.json
    life.json
    personality.json
    general.json

  careers.json
  classes.json
  powers.json
  weaknesses.json
  abilities.json
  workStyles.json
  animals.json
  alignments.json
  synergyRules.json

  matchBaselines.json
  appearanceCalibration.json
  index.ts
```

## Volumes attendus

| Groupe | Volume |
| --- | ---: |
| Questions | 150 |
| Réponses | 1 500 |
| Métiers | 200 |
| Classes | 150 |
| Pouvoirs | 150 |
| Faiblesses | 150 |
| Capacités | 150 |
| Styles de travail | 150 |
| Animaux | 150 |
| Alignements | 9 |
| Synergies | 200 |

Chaque fichier de questions contient exactement 30 questions et chaque question contient exactement 10 réponses.

## Localisation

Tout texte visible doit fournir les trois langues :

```json
{
  "en": "English text",
  "fr": "Texte français",
  "es": "Texto español"
}
```

## Questions

Une question conserve :

- un `id` unique ;
- une `category` utilisée par l'équilibrage du tirage ;
- éventuellement un `selectionWeight` ;
- un texte EN / FR / ES ;
- exactement 10 réponses uniques ;
- des effets utilisant uniquement les statistiques officielles du quiz.

Les cinq fichiers thématiques servent à organiser le contenu. Le nom du fichier ne remplace pas le champ `category` : les catégories historiques ont été conservées afin de ne pas modifier silencieusement la sélection des questions.

Une partie utilise toujours 20 questions parmi les 150 et affiche 3 réponses parmi les 10 pour chaque question.

## Résultats

Les groupes `careers`, `classes`, `powers`, `abilities`, `workStyles` et `animals` utilisent un `idealProfile`. Les faiblesses utilisent `lowProfile`.

Les métiers doivent aussi fournir `worthPotential`. Les animaux doivent fournir une `description` localisée.

Tous les IDs doivent rester uniques et stables. Ne pas créer de variantes temporaires comme `_new`, `_extra` ou `_2` pour contourner un conflit d'ID.

## Baselines

`matchBaselines.json` est l'unique source de normalisation du matching. Il couvre exactement les 1 100 entrées de résultats :

- 200 métiers ;
- 150 classes ;
- 150 pouvoirs ;
- 150 faiblesses ;
- 150 capacités ;
- 150 styles de travail ;
- 150 animaux.

Il est généré de manière déterministe avec :

```bash
BASELINE_SAMPLES=50000 npm run sim:build-baselines
```

La CI régénère le fichier et vérifie qu'il est identique à la version commitée.

## Calibration d'apparition

`appearanceCalibration.json` contient les fréquences marginales estimées d'apparition des sept groupes de résultats et des neuf alignements.

La calibration finale utilise 200 000 parties déterministes :

```bash
APPEARANCE_SAMPLES=200000 npm run sim:build-appearance
```

La simulation reprend la vraie logique de `selectQuestions` et `selectAnswers`, puis le même principe de matching normalisé que le runtime.

Ces fréquences servent à la **rareté hybride estimée**. Elles ne représentent pas une probabilité jointe statistique exacte du profil final.

## Validation

Avant de proposer une modification de contenu :

```bash
npm run content:validate
npm run rarity:validate
npm run typecheck
npm run build
```

`content:validate` contrôle notamment les volumes, les IDs, les trois traductions, les profils, la couverture exacte des baselines et de la calibration ainsi que la conservation du contenu historique.

## Ajouter du contenu à l'avenir

Les volumes sont actuellement verrouillés par les validateurs. Pour augmenter une catégorie :

1. modifier explicitement la cible dans le validateur ;
2. ajouter les nouvelles entrées dans le fichier canonique concerné ;
3. régénérer `matchBaselines.json` ;
4. régénérer `appearanceCalibration.json` ;
5. vérifier la rareté, les types et le build.

Ne recréez pas de fichiers `extra`, `expansion` ou `more` : toute nouvelle entrée doit être ajoutée directement à la source canonique correspondante.
