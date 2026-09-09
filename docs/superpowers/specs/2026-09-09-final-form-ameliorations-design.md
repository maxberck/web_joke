# Refonte globale de Final Form Quiz

## Objectif
Renforcer la qualité globale du quiz sans changer son identité : contenu plus drôle et plus varié, règles de données plus sûres, écran d'analyse moins répétitif et résultat final plus partageable.

## Principes
- Conserver l'identité Japandi × Pop Art et la compatibilité EN/FR/ES.
- Garder exactement neuf alignements couvrant la grille 3×3.
- Interdire les plages d'alignement inversées et les résultats surnaturels contraires au guide éditorial.
- Privilégier l'humour réaliste, hyper-spécifique et légèrement humiliant plutôt qu'un ton de quiz générique.
- Donner à la fin du quiz une hiérarchie claire : titre + rareté, combinaison principale, détails avancés.
- Ne pas masquer les statistiques existantes : les rendre secondaires et repliables.
- Rendre les synergies lisibles en transformant les identifiants techniques en badges humains.
- Ajouter un partage natif avec repli vers le presse-papiers.

## Changements prévus
1. Corriger les alignements et renforcer les validations de contenu.
2. Enrichir `results.extra.json` avec plusieurs résultats plausibles par catégorie.
3. Remplacer les étapes d'analyse fixes par un pool localisé et variable.
4. Recomposer `FinalFormCard` avec verdict, niveau de rareté, résumé de profil, détails repliables et partage.
5. Ajouter les styles nécessaires à la révélation finale, au mobile et aux badges.

## Vérification
Les changements doivent rester compatibles avec `npm run content:validate`, `npm run typecheck` et `npm run build`. La CI GitHub est utilisée comme preuve d'intégration lorsque l'exécution locale du dépôt n'est pas disponible.