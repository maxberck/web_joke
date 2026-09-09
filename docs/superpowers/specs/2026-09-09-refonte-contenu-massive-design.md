# Refonte massive du contenu — design

Date : 2026-09-09
Statut : design validé en conversation
Branche : `feat/refonte-contenu-massive`

## 1. Objectif

Simplifier durablement l’architecture des données du quiz tout en augmentant fortement la diversité des résultats.

La refonte doit :

- supprimer la fragmentation historique `extra`, `expansion` et `more` ;
- ranger les questions dans cinq fichiers thématiques stables ;
- conserver toutes les entrées existantes sans perte d’ID, de catégorie ou de traduction ;
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
- réécrire la formule de rareté hybride sans nécessité technique démontrée ;
- supprimer ou renommer arbitrairement les IDs existants.

Les éventuelles améliorations du tirage des 3 réponses feront l’objet d’un chantier séparé.

## 3. Volumes cibles

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

Chaque question conserve exactement 10 réponses. Toute entrée textuelle visible par l’utilisateur doit être localisée en `en`, `fr` et `es`.

## 4. Structure cible exacte

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
```

Après migration réussie, les anciennes sources fragmentées disparaissent :

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

`rarityDistribution.json` est legacy. Il ne doit plus influencer la rareté hybride. Sa suppression est incluse si toutes ses références runtime et validations deviennent inutiles pendant la refonte.

## 5. Répartition des 150 questions

La cible est exactement 30 questions par fichier :

| Fichier | Nombre |
| --- | ---: |
| `questions/work.json` | 30 |
| `questions/social.json` | 30 |
| `questions/life.json` | 30 |
| `questions/personality.json` | 30 |
| `questions/general.json` | 30 |
| **Total** | **150** |

Les 100 questions existantes sont rangées dans ces cinq fichiers sans perte d’ID. Cinquante nouvelles questions sont ajoutées pour atteindre la cible.

**Le fichier thématique et `question.category` sont distincts.** Pendant la canonicalisation, le champ `question.category` de chaque question existante est conservé à l’identique afin de ne pas modifier silencieusement l’équilibrage de `selectQuestions`. Les nouvelles questions reçoivent une catégorie explicite compatible avec l’équilibrage existant.

## 6. Migration des données existantes

La migration se déroule en deux phases :

1. **Canonicalisation** : fusionner toutes les sources actuelles dans les nouveaux fichiers sans ajouter de contenu.
2. **Expansion** : ajouter les nouvelles entrées jusqu’aux volumes cibles.

Avant suppression des anciens fichiers, un validateur de migration doit comparer avant/après :

- tous les IDs de questions ;
- tous les IDs de réponses ;
- la valeur `question.category` de chaque question existante ;
- tous les IDs de chaque groupe de résultats ;
- tous les IDs de synergies ;
- les traductions EN / FR / ES existantes ;
- les profils (`idealProfile` / `lowProfile`) existants ;
- les descriptions animales existantes.

Aucun ID existant et aucune catégorie de question existante ne peuvent disparaître ou changer silencieusement.

Les nouvelles entrées utilisent des IDs stables et descriptifs, sans suffixes artificiels `_2`, `_new` ou `_extra`.

## 7. Règles de qualité du nouveau contenu

### Questions et réponses

Chaque nouvelle question doit :

- être compréhensible sans contexte externe ;
- proposer 10 réponses réellement distinctes ;
- produire des effets utiles sur plusieurs axes statistiques ;
- ne pas dupliquer une question existante sous une formulation quasi identique ;
- rester compatible avec le ton humoristique du projet ;
- avoir tous ses textes en EN / FR / ES.

Les réponses doivent éviter de concentrer systématiquement les mêmes effets sur les mêmes statistiques afin de ne pas écraser la distribution globale.

### Résultats

Les nouvelles entrées doivent occuper différentes zones de l’espace statistique et éviter les variantes quasi identiques d’un même archétype.

Pour chaque groupe :

- IDs uniques ;
- noms localisés EN / FR / ES ;
- profils variés ;
- animaux avec description localisée ;
- métiers avec `worthPotential` valide ;
- faiblesses avec `lowProfile` ;
- autres groupes avec `idealProfile`.

## 8. Runtime après refonte

`src/data/index.ts` ne doit plus connaître `extra`, `expansion` ou `more`.

Il importe uniquement :

- les cinq fichiers de questions ;
- un seul fichier canonique par groupe de résultats ;
- `alignments.json` ;
- `synergyRules.json` ;
- `matchBaselines.json` ;
- `appearanceCalibration.json`.

Le `ContentPack` final contient directement les 150 questions et les listes canoniques. Les assertions runtime continuent à vérifier les IDs, profils, alignements, baselines et probabilités d’apparition.

## 9. Sélection des questions et réponses

Le gameplay reste inchangé :

- 20 questions choisies par partie ;
- aucune question répétée dans une partie ;
- équilibrage par `question.category` conservé ;
- 3 réponses affichées parmi les 10 ;
- comportement actuel de `selectAnswers` conservé ;
- `selectionWeight` toujours supporté.

Le passage de 100 à 150 questions augmente la rejouabilité sans augmenter la durée d’une partie.

## 10. Simulation partagée

Le générateur de baselines et le générateur de calibration doivent partager le même module de chargement du contenu et la même logique de sampling du jeu afin d’éviter deux modèles divergents.

Le module partagé doit gérer :

- chargement des cinq fichiers de questions ;
- chargement des fichiers canoniques de résultats ;
- seed déterministe ;
- sélection de 20 questions ;
- sélection de 3 réponses affichées selon la logique actuelle ;
- choix simulé d’une réponse ;
- application des effets et clamp 0..100.

## 11. Baselines de matching

Les anciennes baselines fragmentées sont remplacées par un unique `matchBaselines.json` généré de manière déterministe sur le corpus complet.

Pipeline :

1. corpus final questions/réponses ;
2. corpus final résultats ;
3. simulation déterministe des stats ;
4. calcul des distances moyennes et écarts-types par entrée ;
5. écriture de `matchBaselines.json` ;
6. validation de couverture à 100 %.

Aucune entrée de résultat ne doit être acceptée sans baseline valide (`mean` fini, `std > 0`).

## 12. Calibration d’apparition et rareté

Après génération des baselines, `appearanceCalibration.json` est recalculé sur le corpus final avec **200 000 parties déterministes**.

La simulation doit reproduire :

- 20 questions parmi 150 ;
- sélection pondérée si `selectionWeight` existe ;
- 3 réponses affichées selon la logique actuelle ;
- une réponse simulée ;
- matching avec les baselines finales ;
- calcul des 8 composants : métier, classe, pouvoir, faiblesse, capacité, style de travail, animal, alignement.

`appearanceCalibration.json` reste versionné. La CI recalcule la calibration vers un fichier temporaire avec la même seed et les mêmes 200 000 simulations, puis compare le JSON généré au fichier versionné.

La rareté hybride continue à combiner : probabilités d’apparition des 8 composants, score de synergie, score d’extrémité et multiplicateur comportemental actuel, avec les mêmes plancher/plafond.

## 13. Synergies

La cible est entre 90 et 110 règles, idéalement environ 100.

Les nouvelles règles doivent :

- utiliser uniquement des `StatKey` valides ;
- avoir au moins une condition ;
- avoir un `rarityScore` fini ;
- éviter les doublons logiques ;
- couvrir davantage de combinaisons de traits ;
- ne pas rendre le multiplicateur comportemental systématiquement élevé.

Un contrôle statistique doit signaler les synergies presque toujours actives ou pratiquement impossibles sur l’échantillon de calibration.

## 14. Validations automatiques

La CI finale doit valider au minimum :

- exactement 150 questions ;
- exactement 1 500 réponses ;
- exactement 30 questions dans chacun des 5 fichiers ;
- exactement 100 métiers ;
- exactement 75 classes ;
- exactement 75 pouvoirs ;
- exactement 75 faiblesses ;
- exactement 75 capacités ;
- exactement 75 styles de travail ;
- exactement 75 animaux ;
- exactement 9 alignements ;
- 90 à 110 synergies ;
- aucun ID dupliqué ;
- 10 réponses par question ;
- traductions EN / FR / ES présentes ;
- profils et effets statistiques valides ;
- catégories historiques préservées pour les 100 questions existantes ;
- baselines complètes et valides ;
- probabilités d’apparition complètes et normalisées ;
- calibration 200 000 simulations reproductible ;
- rareté hybride granulaire ;
- `npm run typecheck` vert ;
- `npm run build` vert.

## 15. Ordre d’implémentation recommandé

1. Ajouter les validateurs de migration et de volumes cibles en RED.
2. Créer les cinq fichiers de questions et canonicaliser les 100 questions existantes.
3. Fusionner les résultats existants dans les fichiers canoniques.
4. Simplifier `src/data/index.ts` sur la nouvelle structure.
5. Ajouter 50 nouvelles questions / 500 réponses.
6. Étendre tous les groupes de résultats jusqu’aux volumes cibles.
7. Étendre les synergies à environ 100 règles.
8. Créer le sampling partagé des simulations.
9. Générer un unique `matchBaselines.json`.
10. Régénérer `appearanceCalibration.json` sur 200 000 parties.
11. Supprimer les anciennes sources fragmentées et le legacy devenu inutilisé.
12. Mettre à jour `CONTENT_GUIDE.md` et la CI.
13. Vérifier migration, contenu, rareté, typecheck et build avant fusion.

## 16. Critères d’acceptation

La refonte est terminée uniquement si :

- tous les anciens IDs sont préservés ;
- les catégories des 100 questions existantes sont préservées ;
- les fichiers `extra`, `expansion` et `more` visés ont disparu ;
- seules les cinq sources de questions convenues restent ;
- les volumes cibles sont atteints ;
- toutes les nouvelles entrées sont localisées EN / FR / ES ;
- les baselines sont régénérées et couvrent 100 % des résultats ;
- la calibration d’apparition est basée sur 200 000 simulations reproductibles ;
- le gameplay reste 20 questions / 3 réponses affichées ;
- le calcul final et la rareté hybride restent fonctionnels ;
- typecheck et build production sont verts.
