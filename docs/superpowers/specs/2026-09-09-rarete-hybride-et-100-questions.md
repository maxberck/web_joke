# Rareté hybride et extension à 100 questions

## Contexte
Le quiz dispose actuellement de 70 questions (10 réponses chacune), mais une partie en sélectionne 20 et affiche 3 réponses par question. La rareté finale repose aujourd’hui sur un score fixe combinant synergies et extrémité des statistiques, puis mappe ce score vers un petit nombre de paliers `1/X`. Elle ne tient donc pas compte de la fréquence réelle ou estimée d’apparition des composants du résultat final.

## Objectifs
- Porter le pool de questions de 70 à **100**, avec **10 réponses localisées EN/FR/ES par question**, soit **1 000 réponses** au total.
- Conserver **20 questions par partie** et **3 réponses affichées par question** afin de ne pas rallonger une session.
- Remplacer la rareté à paliers grossiers par une rareté **hybride et granulaire**.
- Faire intervenir dans la rareté finale :
  1. la rareté d’apparition des composants de profil (métier, classe, pouvoir, faiblesse, capacité, style de travail, animal, alignement),
  2. la rareté comportementale issue des synergies,
  3. l’extrémité statistique du profil.
- Garder un plancher d’affichage de **1/25** et un plafond de **1/1 000 000 000**.
- Produire des valeurs `1/X` beaucoup plus variées, avec arrondi lisible plutôt qu’une liste de 10 valeurs fixes.

## Architecture retenue
### 1. Calibration d’apparition
Ajouter un fichier de données de calibration qui associe à chaque résultat sélectionnable une probabilité d’apparition estimée. Cette calibration est générée par un script de simulation reproductible et versionnée dans `src/data/appearanceCalibration.json`.

Le script de simulation :
- génère un grand nombre de profils synthétiques à partir du pipeline de stats et des distributions de réponses,
- exécute les matchers de résultats,
- compte les occurrences de chaque identifiant,
- applique un lissage de Laplace pour éviter une probabilité nulle,
- écrit les probabilités normalisées par catégorie.

Une calibration versionnée permet au runtime navigateur de rester simple et déterministe. Le script reste disponible pour recalibrer après une grosse évolution des questions ou des résultats.

### 2. Score d’apparition du profil
Pour une Final Form donnée, chaque composant fournit une probabilité `p_i`. On calcule une rareté structurelle à partir de la moyenne géométrique des probabilités plutôt que du produit brut, afin d’éviter des `1/X` astronomiques artificiels juste parce que huit dimensions sont combinées.

Forme cible :
- `appearanceOneInX = 1 / geometricMean(p_i)` puis facteur de combinaison contrôlé,
- bornage raisonnable,
- les composants moins fréquents font monter la rareté finale.

### 3. Rareté comportementale
Le moteur conserve :
- `synergyOutcome.totalRarityScore`,
- `extremityScore`.

Ces éléments sont convertis en multiplicateurs progressifs :
- profil banal : multiplicateur proche de `1`,
- profil très extrême / nombreuses synergies rares : multiplicateur plus élevé.

### 4. Rareté finale
`rawOneInX = appearanceOneInX × behavioralMultiplier`

Puis :
- minimum `25`,
- maximum `1_000_000_000`,
- arrondi lisible à 2 chiffres significatifs environ, tout en gardant beaucoup plus de diversité qu’une table de paliers.

La `rarity.score` reste disponible pour compatibilité et représente le score comportemental combiné.

## Contenu questions
Ajouter 30 nouvelles questions dans un fichier d’extension séparé afin de conserver les fichiers existants lisibles.

Contraintes par question :
- `id` unique,
- `category` existante ou cohérente avec l’équilibrage actuel,
- texte EN/FR/ES,
- exactement 10 réponses,
- chaque réponse EN/FR/ES,
- effets sur les stats dans les limites déjà admises,
- ton réaliste, absurde, partageable, cohérent avec Final Form Quiz.

Les nouvelles questions doivent couvrir des situations variées : travail, social, argent, imprévus, technologie, décisions, énergie, stress, créativité et chaos quotidien.

## UI
La carte finale garde un seul grand `1/X`. Dans le panneau détaillé, ajouter un découpage court :
- **Occurrence du profil**,
- **Synergies**,
- **Extrémité**.

Le détail doit rester secondaire pour ne pas surcharger la révélation.

## Validation
Le pipeline de contenu doit vérifier :
- exactement ou au minimum 100 questions,
- 1 000 réponses au total,
- toutes les traductions présentes,
- toutes les calibrations présentes pour chaque résultat sélectionnable,
- probabilités finies et strictement positives,
- somme des probabilités de chaque catégorie proche de 1,
- rareté finale toujours comprise entre 25 et 1 000 000 000.

## Compatibilité
- Aucun changement de durée d’une partie : 20 questions.
- Aucun changement du nombre de réponses visibles : 3.
- Les anciennes données restent valides.
- Le résultat final doit rester déterministe avec le seed existant.
