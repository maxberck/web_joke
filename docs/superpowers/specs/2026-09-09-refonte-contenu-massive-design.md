# Refonte massive du contenu — design

Date : 2026-09-09
Statut : design validé en conversation, à relire avant plan d’implémentation
Branche : `feat/refonte-contenu-massive`

## 1. Objectif

Simplifier durablement l’architecture des données du quiz tout en augmentant fortement la diversité des résultats.

La refonte doit :

- supprimer la fragmentation historique `extra`, `expansion` et `more` pour les données de résultats ;
- ranger les questions dans des fichiers thématiques stables ;
- conserver toutes les entrées existantes sans perte d’ID ni de traduction ;
- augmenter fortement le nombre de métiers, classes, pouvoirs, faiblesses, capacités, styles de travail, animaux et synergies ;
- conserver les trois langues EN / FR / ES ;
- régénérer les baselines de matching et la calibration d’apparition sur le nouveau corpus ;
- préserver le gameplay actuel : 20 questions par partie et 3 réponses affichées par question ;
- conserver la rareté hybride actuelle, mais la recalibrer sur le nouveau contenu.

## 2. Non-objectifs

Cette refonte ne doit pas :

- modifier le design visuel du quiz ;
- changer le nombre de questions jouées par partie ;
- modifier la logique de sélection des questions/réponses dans ce chantier ;
- changer les 9 alignements canoniques ;
- réécrire le moteur de matching ou la formule de rareté hybride sans nécessité technique démontrée ;
- supprimer ou renommer arbitrairement les IDs existants.

Les éventuelles améliorations du tirage des 3 réponses feront l’objet d’un chantier séparé.

## 3. Volumes cibles

Les volumes sont des objectifs exacts pour la première version de cette refonte, sauf les synergies où une petite marge est acceptable si la validation révèle des règles redondantes.

| Groupe | Actuel | Cible |
| --- | ---: | ---: |
| Questions | 100 | 150 |
| Réponses disponibles | 1 000 | 1 500 |
| Métiers | 50 | 100 |
| Classes | 30 | 75 |
| Pouvoirs | 30 | 75 |
| Faiblesses | 30 | 75 |
| Capacités | 30 | 75 |
| Styles de travail | 30 | 75 |
| Animaux | 30 | 75 |
| Alignements | 9 | 9 |
| Synergies | 45 | ~100 |

Chaque question conserve exactement 10 réponses.

Chaque entrée textuelle visible par l’utilisateur doit être localisée en `en`, `fr` et `es`.

## 4. Structure cible des fichiers

```text
src/data/
  questions/
    work.json
    social.json
    life.json
    personality.json
    money.json
    tech.json
    chaos.json
    decisions.json

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
```

Les fichiers suivants disparaissent après migration réussie :

- `questions.json`
- `questions.expansion.json`
- `questions.extra.json`
- `questions.more.work.json`
- `questions.more.social.json`
- `questions.more.life.json`
- `careers.expansion.json`
- `classes.expansion.json`
- `powers.expansion.json`
- `weaknesses.expansion.json`
- `abilities.expansion.json`
- `workStyles.expansion.json`
- `animals.expansion.json`
- `results.extra.json`
- `synergyRules.extra.json`
- `synergyRules.expansion.json`
- `matchBaselines.extra.json`
- `matchBaselines.expansion.json`

`rarityDistribution.json` est legacy. Il ne doit pas être utilisé pour calculer la rareté hybride. Sa suppression peut être incluse uniquement si aucune référence runtime ou validation utile ne subsiste ; sinon elle sera traitée séparément.

## 5. Répartition des 150 questions

La répartition cible est :

| Fichier | Nombre |
| --- | ---: |
| `work.json` | 20 |
| `social.json` | 20 |
| `life.json` | 20 |
| `personality.json` | 20 |
| `money.json` | 15 |
| `tech.json` | 15 |
| `chaos.json` | 20 |
| `decisions.json` | 20 |
| **Total** | **150** |

Les 100 questions existantes sont rangées dans ces huit fichiers selon leur thème, sans perte d’ID. Cinquante nouvelles questions sont ajoutées pour atteindre la cible.

**Le fichier thématique et `question.category` sont deux notions distinctes.** Pendant la canonicalisation, le champ `question.category` de chaque question existante est conservé à l’identique afin de ne pas changer silencieusement l’équilibrage de `selectQuestions`. Le classement dans `questions/work.json`, `questions/social.json`, etc. sert uniquement à l’organisation du contenu. Les nouvelles questions reçoivent une catégorie choisie explicitement pour rester compatible avec l’équilibrage existant.

## 6. Migration des données existantes

La migration se fait en deux phases logiques :

1. **Canonicalisation** : fusionner toutes les sources existantes dans les nouveaux fichiers canoniques sans ajouter de nouveau contenu.
2. **Expansion** : ajouter les nouvelles entrées jusqu’aux volumes cibles.

Avant suppression des anciens fichiers, un validateur de migration doit comparer :

- l’ensemble des IDs questions avant/après ;
- l’ensemble des IDs réponses avant/après ;
- la valeur `question.category` de chaque question existante avant/après ;
- l’ensemble des IDs de chaque groupe de résultats avant/après ;
- l’ensemble des IDs de synergies avant/après ;
- les traductions EN / FR / ES existantes ;
- les profils (`idealProfile` / `lowProfile`) existants ;
- les descriptions animales existantes.

Aucun ID existant et aucune catégorie de question existante ne peuvent disparaître ou changer silencieusement.

Les nouvelles entrées utilisent des IDs explicites, stables et descriptifs, sans suffixes artificiels du type `_2`, `_new` ou `_extra`.

## 7. Règles de qualité pour le nouveau contenu

### Questions et réponses

Chaque nouvelle question :

- doit être compréhensible sans contexte externe ;
- doit proposer 10 réponses réellement distinctes ;
- doit produire des effets utiles sur plusieurs axes statistiques ;
- ne doit pas dupliquer une question existante sous une formulation quasi identique ;
- doit rester compatible avec le ton humoristique du projet ;
- doit avoir ses textes en EN / FR / ES.

Les réponses doivent éviter de concentrer systématiquement les mêmes effets sur les mêmes statistiques afin de ne pas écraser la distribution globale.

### Résultats

Les nouvelles catégories doivent rester variées en ton et en profil. Il faut éviter de créer 40 variantes du même archétype comportemental.

Pour chaque groupe :

- les profils doivent occuper différentes zones de l’espace statistique ;
- les IDs doivent être uniques ;
- les noms doivent être localisés ;
- les animaux doivent avoir une description localisée ;
- les métiers doivent avoir un `worthPotential` valide ;
- les faiblesses utilisent `lowProfile` ;
- les autres groupes utilisent `idealProfile`.

## 8. Runtime après refonte

`src/data/index.ts` ne doit plus connaître les concepts `extra` ou `expansion`.

Il doit importer :

- les huit fichiers de questions ;
- un seul fichier canonique par groupe de résultats ;
- `alignments.json` ;
- `synergyRules.json` ;
- `matchBaselines.json` ;
- `appearanceCalibration.json`.

Le `ContentPack` final contient directement les 150 questions et les listes canoniques.

Les assertions runtime continuent à vérifier les IDs, les profils, les alignements, les baselines et la calibration.

## 9. Sélection des questions et réponses

Le gameplay est volontairement inchangé dans cette refonte :

- 20 questions sont choisies par partie ;
- aucune question ne se répète dans une partie ;
- l’équilibrage par catégorie est conservé ;
- 3 réponses sont affichées parmi les 10 de chaque question ;
- le comportement actuel de `selectAnswers` est conservé dans ce chantier ;
- les `selectionWeight` existants restent supportés.

Le passage de 100 à 150 questions augmente la rejouabilité sans augmenter la durée d’une partie.

## 10. Baselines de matching

Les nouvelles entrées rendent les anciennes baselines insuffisantes.

La cible est de supprimer la dépendance aux baselines ajoutées manuellement au fil des extensions et de produire un unique `matchBaselines.json` régénéré de manière déterministe sur le corpus complet.

Pipeline recommandé :

1. corpus questions/réponses final ;
2. corpus résultats final ;
3. simulation déterministe pour calculer les distances moyennes et écarts-types de chaque résultat ;
4. écriture de `matchBaselines.json` ;
5. validation de couverture à 100 %.

Aucune entrée de résultat ne doit être acceptée sans baseline valide (`mean` fini, `std > 0`).

Le générateur de baselines et le générateur de calibration doivent partager la même logique de sampling du jeu (questions, réponses affichées, seed) afin d’éviter deux modèles de simulation divergents.

## 11. Calibration d’apparition et rareté

Après génération des baselines, `appearanceCalibration.json` est recalculé sur le corpus final.

La calibration d’apparition doit utiliser **200 000 parties déterministes** afin de mieux distinguer les résultats rares dans des catégories de 75 à 100 entrées.

La simulation doit reproduire le gameplay réel :

- 20 questions parmi 150 ;
- sélection pondérée si `selectionWeight` existe ;
- 3 réponses affichées selon la logique actuelle de `selectAnswers` ;
- une réponse choisie par la simulation selon les pondérations définies par le simulateur ;
- matching avec les baselines finales ;
- calcul des 8 composants : métier, classe, pouvoir, faiblesse, capacité, style de travail, animal, alignement.

`appearanceCalibration.json` reste versionné dans Git.

La CI doit recalculer la calibration vers un fichier temporaire avec la même seed et le même nombre de simulations, puis comparer structurellement le JSON généré au JSON versionné. Toute dérive doit faire échouer la CI.

La rareté hybride finale continue à combiner :

- les probabilités d’apparition des 8 composants ;
- le score de synergie ;
- le score d’extrémité ;
- le multiplicateur comportemental actuel ;
- le plancher et plafond actuels de rareté.

## 12. Synergies

La cible est environ 100 règles de synergie.

Les nouvelles règles doivent :

- utiliser uniquement des `StatKey` valides ;
- avoir au moins une condition ;
- avoir un `rarityScore` fini ;
- éviter les doublons logiques ;
- couvrir davantage de combinaisons de traits que les 45 règles actuelles ;
- ne pas rendre le multiplicateur comportemental systématiquement élevé.

Un contrôle statistique doit signaler si une synergie est pratiquement toujours active ou pratiquement impossible sur l’échantillon de calibration.

## 13. Validations automatiques

La CI finale doit au minimum valider :

- exactement 150 questions ;
- exactement 1 500 réponses ;
- exactement 100 métiers ;
- exactement 75 classes ;
- exactement 75 pouvoirs ;
- exactement 75 faiblesses ;
- exactement 75 capacités ;
- exactement 75 styles de travail ;
- exactement 75 animaux ;
- exactement 9 alignements ;
- au moins 90 et au plus 110 synergies ;
- aucun ID dupliqué ;
- 10 réponses par question ;
- traductions EN / FR / ES présentes ;
- profils et effets statistiques valides ;
- toutes les baselines présentes et valides ;
- toutes les probabilités d’apparition présentes et normalisées ;
- calibration 200 000 simulations reproductible ;
- rareté hybride granulaire ;
- `npm run typecheck` vert ;
- `npm run build` vert.

## 14. Ordre d’implémentation recommandé

1. Écrire les tests/validateurs de migration et de volumes cibles.
2. Créer la nouvelle arborescence des questions.
3. Fusionner les données existantes sans perte.
4. Simplifier `src/data/index.ts` sur les sources canoniques.
5. Ajouter 50 nouvelles questions / 500 réponses.
6. Étendre les résultats jusqu’aux volumes cibles.
7. Étendre les synergies.
8. Régénérer toutes les baselines.
9. Régénérer la calibration sur 200 000 parties.
10. Supprimer les anciens fichiers devenus inutiles.
11. Mettre à jour `CONTENT_GUIDE.md`.
12. Exécuter toute la CI et vérifier le diff de migration.

## 15. Critères d’acceptation

La refonte est terminée uniquement si :

- les anciens IDs sont tous préservés ;
- les catégories des questions existantes sont préservées ;
- les fichiers `extra`, `expansion` et `more` visés ont disparu ;
- les questions sont rangées dans les huit thèmes convenus ;
- les volumes cibles sont atteints ;
- toutes les nouvelles entrées sont localisées EN / FR / ES ;
- les baselines sont régénérées et couvrent 100 % des résultats ;
- la calibration d’apparition est basée sur 200 000 simulations reproductibles ;
- le gameplay d’une partie reste 20 questions / 3 réponses affichées ;
- le calcul final et la rareté hybride restent fonctionnels ;
- typecheck et build production sont verts.
