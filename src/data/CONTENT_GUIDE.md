# Guide de contenu — Final Form Quiz

## Pourquoi ce guide existe

Le JSON standard n'accepte pas les commentaires : impossible d'annoter directement
`questions.json`, `careers.json`, etc. Ce guide remplit ce rôle — il documente le
schéma EXACT de chaque fichier, les règles éditoriales, les contraintes de
validation, et fournit des prompts prêts à l'emploi pour générer du contenu
supplémentaire avec une IA (Claude ou autre) sans casser le moteur.

**Règle d'or** : toute IA qui génère du contenu doit produire du JSON qui passe
`npm run content:validate` sans erreur. Ce script est la source de vérité pour
la validité structurelle — ce guide explique le POURQUOI et le CONTEXTE éditorial
que le script ne peut pas vérifier (le ton, la pertinence des idealProfile, etc.).

---

## 1. Les 15 stats — la seule liste qui ne doit JAMAIS changer sans mettre à jour le moteur

```
intelligence, humor, discipline, luck, social, emotionalControl, creativity,
ambition, energy, professionalism, communication, financialSense, chaos,
risk, empathy
```

- Ce sont les SEULES clés valides dans `effects`, `idealProfile`, `lowProfile`,
  et les `conditions` des règles de synergie (`stat` field).
- Casse exacte : `emotionalControl` (pas `emotional_control` ni `EmotionalControl`),
  `financialSense` (pas `financial_sense`).
- Toute clé absente de cette liste fait échouer `content:validate`.
- Plage finale après clamp : 0–100. Valeur de départ neutre : 50.

---

## 2. `questions.json`

```jsonc
{
  "id": "q_unique_snake_case",       // unique, préfixé "q_"
  "category": "money",               // voir liste de catégories ci-dessous
  "selectionWeight": 1,              // 1 par défaut ; >1 = sélectionné plus souvent
  "text": { "en": "...", "fr": "...", "es": "..." },
  "answers": [ /* EXACTEMENT 10 objets Answer, voir ci-dessous */ ]
}
```

**Answer** (10 par question, ni plus ni moins — `content:validate` vérifie ce nombre exact) :

```jsonc
{
  "id": "a1",                        // a1..a10, unique DANS la question seulement
  "text": { "en": "...", "fr": "...", "es": "..." },
  "effects": {                       // Partial<Record<StatKey, number>> — 2 à 5 stats touchées typiquement
    "intelligence": 6,
    "chaos": -3
  },
  "selectionWeight": 1               // optionnel, défaut 1
}
```

**Catégories utilisées actuellement** (tu peux en ajouter, le moteur ne les valide
pas structurellement, mais garde une catégorie par thème réel) :
`money, work, general, social, emotions, family, decisions, unforeseen, humor,
risk, ambition, friends, organization, stress, habits, creativity`

**Règles pour les `effects`** :
- Magnitude typique : -9 à +9 par stat et par réponse. Rarement au-delà de ±9.
- Chaque réponse touche entre 2 et 5 stats (jamais 1 seule, jamais plus de 5-6).
- Les 10 réponses d'une même question doivent être statistiquement DIVERSES : au
  moins 3-4 "directions" clairement différentes (ex: une réponse prudente, une
  risquée, une chaotique, une posée). Le moteur choisit 3 réponses parmi les 10
  en maximisant la diversité des effets (`selectAnswers.ts`, farthest-point
  sampling) — si les 10 réponses sont trop proches entre elles, ce mécanisme perd
  son intérêt.
- Évite les réponses "no-op" avec un seul effet minuscule — chaque réponse doit
  avoir un vrai impact.

**Règle éditoriale (section 31 du concept original + calibration d'humour révisée,
voir section 8 plus bas)** : les situations doivent être réalistes et
quotidiennes (travail, argent, amis, famille, imprévus, décisions, stress,
habitudes...). Jamais de science-fiction, pouvoirs surnaturels, ou entreprises
fictives présentées comme réelles. **Le ton actuel est trop sage — viser ~40%
de situations/réponses franchement absurdes (mais toujours ancrées dans le
réel), voir la section 8 pour le détail et des exemples calibrés.**

---

## 3. `careers.json`

```jsonc
{
  "id": "career_unique_snake_case",
  "name": { "en": "...", "fr": "...", "es": "..." },
  "idealProfile": {                  // 3 à 6 stats, valeurs 0-100 = profil "parfait" pour ce métier
    "intelligence": 85,
    "discipline": 70
  },
  "worthPotential": { "min": -5000, "max": 90000 },  // fourchette de Worth en $ (peut être négatif)
  "tags": ["very_real"]              // "very_real" | "real_but_particular" | "humorous_plausible"
}
```

**Répartition éditoriale cible (mise à jour, voir section 8 pour le détail
complet)** — ~20% sérieux, ~40% particulier, ~40% absurde :
- `very_real` : médecin, avocat, ingénieur, enseignant... des métiers que tout le
  monde connaît.
- `real_but_particular` : détective privé, commissaire-priseur, toiletteur
  animalier... des vrais métiers mais moins courants.
- `humorous_plausible` : intitulés absurdes mais qui SONNENT comme de vrais
  postes ("Professional Excuse Consultant", "Emergency Spreadsheet Specialist").
  Le ton est absurde, jamais surnaturel ou impossible.

**⚠️ Important — matching normalisé (voir README section "Matching normalisé")** :
Le moteur ne compare PAS les distances brutes entre profils. Il utilise un
score-z basé sur des baselines précalculées par simulation
(`src/data/matchBaselines.json`). **Toute nouvelle entrée ajoutée ici doit être
suivie d'un `npm run sim:build-baselines`**, sinon elle retombe sur un matching
brut (fonctionnel mais moins bien calibré face aux entrées déjà normalisées).

**`worthPotential`** : la fourchette doit refléter le métier réel (un médecin a
un potentiel plus élevé qu'un artiste de rue), mais le Worth final n'est pas
purement déterministe — voir `computeWorth.ts` (bruit + risque d'endettement +
jackpot rare indépendant de la carrière).

---

## 4. `animals.json`, `classes.json`, `powers.json`, `abilities.json`, `workStyles.json`

Même structure de base que `careers.json` mais sans `worthPotential`/`tags` :

```jsonc
{
  "id": "animal_unique_id",          // préfixe selon le fichier : animal_, class_, power_, ability_, workstyle_
  "name": { "en": "...", "fr": "...", "es": "..." },   // "text" au lieu de "name" pour powers/abilities/workStyles
  "idealProfile": { "intelligence": 80, "chaos": 60 }  // 2 à 5 stats
}
```

- **`animals.json`** : `name` (pas `text`). Le profil comportemental doit être
  cohérent avec un vrai trait animalier reconnaissable (ex: Raccoon = intelligent
  + créatif + chaotique + peu discipliné).
- **`classes.json`** : `name`. Synthèse du profil global (ex: "The Strategist",
  "Accidental Genius"). Éviter les classes qui se chevauchent trop avec une autre
  (vérifiable via `npm run sim:run` : si une classe ne sort jamais ou trop souvent,
  son `idealProfile` est probablement trop proche/loin d'une autre).
- **`powers.json`** : `text`, formulé comme une phrase à la 3e personne implicite
  ("Can explain complicated things frighteningly well."), toujours une FORCE.
- **`abilities.json`** : `text`, différent de `powers` — très spécifique et
  ridicule plutôt que grande force générale ("Can spend €200 to save €3.").
- **`workStyles.json`** : `text`, décrit un COMPORTEMENT au travail, pas un trait
  de personnalité général (nouveau, ajouté après le concept d'origine).

## 5. `weaknesses.json` — structure différente (lowProfile, pas idealProfile)

```jsonc
{
  "id": "weakness_unique_id",
  "text": { "en": "...", "fr": "...", "es": "..." },
  "lowProfile": { "social": 25, "communication": 30 }  // stats BASSES recherchées, pas hautes
}
```

Une weakness est choisie quand les stats du joueur sont proches de ces valeurs
BASSES (contrepoids du Power). Toujours formuler comme un objet concret et
quotidien ("Phone calls.", "Free shipping."), jamais abstrait ("Weakness of
character.").

## 6. `alignments.json` — grille fixe à 9 cases, ne pas ajouter d'entrées

```jsonc
{
  "id": "chaotic_neutral",
  "name": { "en": "...", "fr": "...", "es": "..." },
  "description": { "en": "...", "fr": "...", "es": "..." },
  "lawfulChaotic": [34, 100],              // [min, max] sur l'axe -100..100
  "selflessSelfInterested": [-33, 33]      // [min, max] sur l'axe -100..100
}
```

Les 9 combinaisons (3×3 : Lawful/Neutral/Chaotic × Selfless/Neutral/Self-Interested)
couvrent déjà tout l'espace possible avec des plages `[-100,-34], [-33,33], [34,100]`
sur chaque axe. **Ne pas ajouter de 10e entrée** — ça casserait la couverture de
la grille. Modifier uniquement les descriptions si besoin.

## 7. `synergyRules.json` — le levier principal contre la stagnation de la rareté

```jsonc
{
  "id": "syn_unique_id",
  "conditions": [                    // TOUTES doivent être vraies pour que la règle se déclenche
    { "stat": "intelligence", "op": ">", "value": 75 },
    { "stat": "chaos", "op": ">", "value": 65 }
  ],
  "weight": 4,                       // spécificité de la règle (plus de conditions = poids plus élevé), sert à trancher les conflits
  "rarityScore": 18,                 // contribution au score de rareté si déclenchée
  "tags": ["brilliant_unfinished"]   // tags consommés ailleurs (actuellement informatifs)
}
```

`op` valides : `>`, `>=`, `<`, `<=`, `==`.

**Barème `rarityScore` recommandé** (calibré sur le contenu actuel, voir
`src/data/synergyRules.json` pour des exemples réels) :
- 2 conditions simples (seuils à 70-75) → `rarityScore` 6-12
- 3 conditions → `rarityScore` 12-18
- 4 conditions ou seuils très élevés (85+) → `rarityScore` 18-26
- 5+ conditions simultanées très extrêmes → `rarityScore` 28-35

**Important** : le score de rareté final combine CES règles ET un score continu
(`computeExtremityScore.ts`, à quel point le profil s'écarte de la neutralité
globalement). Ajouter des règles enrichit les "pics" mémorables (bonus nommés,
via `tags`) mais n'est plus le SEUL moteur de variation — pas besoin d'en ajouter
des dizaines pour éviter la stagnation, quelques-unes bien choisies suffisent.

---

## 8. Calibration du niveau d'humour (mise à jour — le contenu actuel est trop sérieux)

**Constat** : le contenu généré jusqu'ici est trop ancré dans le "réaliste/particulier"
et pas assez dans le franchement absurde. Cible à partir de maintenant, par catégorie
(3 paliers : **Sérieux/réaliste**, **Particulier**, **Absurde**) :

| Catégorie | Sérieux/réaliste | Particulier | Absurde |
|---|---:|---:|---:|
| Questions | ~30% | ~30% | ~40% |
| Réponses | ~15% | ~30% | ~55% |
| Careers / Métiers | ~20% | ~40% | ~40% |
| Classes (= "Titles", même champ) | ~15% | ~30% | ~55% |
| Powers | ~10% | ~25% | ~65% |
| Weaknesses | ~5% | ~25% | ~70% |
| Work Styles | ~15% | ~30% | ~55% |
| Abilities | ~10% | ~25% | ~65% |
| Animals | ~40% | ~30% | ~30% |
| Alignments | ~20% | ~35% | ~45% |
| Synergies | ~10% | ~30% | ~60% |

**"Titles" = `classes.json`**, pas un champ séparé — la table ci-dessus fusionne
les deux lignes. Ne pas créer de fichier `titles.json`.

### Ce que "Absurde" veut dire ICI (ligne rouge à ne jamais franchir)

L'absurde reste **100% ancré dans le réel** — aucune science-fiction, aucun
pouvoir surnaturel, aucune entité impossible. L'absurdité vient de
**l'exagération et de la spécificité hyperréaliste**, pas de l'impossible.

✅ Absurde et VALIDE : *"A perdu un procès contre une machine à café."*,
*"Peut sentir quand quelqu'un va dire 'juste une petite question' à 12 mètres
de distance."*, *"A un PowerPoint de 47 slides pour justifier une pause déjeuner."*

❌ Absurde et INTERDIT (science-fiction/surnaturel) : *"Peut lire dans les
pensées."*, *"Voyage dans le temps pour éviter les lundis."*, *"A des pouvoirs
psychiques."*

La règle simple : si on peut imaginer une vraie personne, avec un talent réel
mais poussé à l'extrême ridicule, c'est bon. Si ça nécessite un pouvoir qui
n'existe pas dans la réalité, c'est refusé.

### Exemples calibrés avant/après (contenu actuel vs cible)

**Question (avant → trop sage, après → trop absurde autorisé)**
- Avant (actuel, trop "particulier/sage") : *"Someone dares you to try something
  genuinely risky."*
- Après (cible, plus absurde) : *"Ton ami te met au défi de manger le dernier
  morceau de gâteau mystère du frigo du bureau, sans savoir depuis combien de
  temps il est là."*

**Career** (répartition cible 20/40/40)
- Sérieux : Comptable, Infirmier, Électricien
- Particulier : Commissaire-priseur, Sommelier, Régisseur
- Absurde (mais crédible comme intitulé) : *"Directeur des Excuses de Dernière
  Minute"*, *"Responsable de la Gestion Émotionnelle du Wifi Public"*,
  *"Chargé de Mission 'On Se Rappelle'"*

**Weakness** (répartition cible 5/25/70 — la catégorie la PLUS absurde)
- Actuel (trop sage) : *"Phone calls."*, *"Group projects."*
- Cible (beaucoup plus absurde/spécifique) : *"Les gens qui disent 'on se fait
  ça' sans jamais fixer de date."*, *"La barre de chargement à 99% qui reste
  bloquée trois minutes."*, *"Le silence gênant après avoir dit 'bonne
  question' sans avoir de réponse."*

**Ability** (répartition cible 10/25/65)
- Actuel (trop sage) : *"Remembers useless information for 17 years."*
- Cible (encore plus spécifique/ridicule) : *"Sait toujours qui a mangé le
  dernier gâteau au bureau, sans preuve, juste un instinct."*, *"Peut
  reconnaître la sonnerie de notification de n'importe quelle app rien qu'au
  bruit, même à travers un mur."*

**Synergy** (répartition cible 10/30/60 — noms de règles plus mémorables)
- Actuel (trop neutre) : `syn_calm_operator` → tag "calm_operator"
- Cible (plus absurde dans le NOM et le TAG, la mécanique reste identique) :
  `syn_human_do_not_disturb_sign` → tag "walking_do_not_disturb_sign" — mêmes
  conditions statistiques, juste un habillage plus mémorable/drôle.

### Nouveau standard de calibration (encore plus poussé) — l'escalade "troll"

Le niveau ci-dessus reste valide, mais pour les **réponses de question**
spécifiquement, viser encore plus fort : les réponses 1-3 restent posées/neutres
(pour ancrer le dilemme dans le réel), puis les réponses suivantes montent en
**escalade comique progressive** — une réaction totalement disproportionnée à
une situation banale, mais qui reste 100% humaine et reconnaissable (jamais de
pouvoir, juste de la sur-réaction).

**Exemple canonique** (voir `q_boss_wants_to_talk` dans `questions.json` pour
l'implémentation complète) — la question "Ton boss veut te parler" :
- Réponses 1-3 (neutres) : demander calmement de quoi il s'agit / dire "ok" et
  y aller / préparer trois explications possibles en chemin.
- Réponses suivantes (escalade) : dire "d'accord !" à voix haute puis suer en
  silence pendant quatre heures → rédiger sa lettre de démission par précaution
  → passer son LinkedIn en "ouvert aux opportunités" avant même d'avoir frappé
  à la porte → texter trois collègues "je suis viré c'est sûr" en dix secondes.

Chaque étape est plus absurde que la précédente, mais reste une réaction humaine
plausible (quelqu'un d'anxieux au travail a VRAIMENT ces pensées) — c'est ça,
la ligne : l'exagération de l'intensité émotionnelle/comportementale, jamais
l'invention d'un pouvoir ou d'un scénario impossible.

**À appliquer à toutes les questions**, pas seulement celles marquées
"absurde" : même les questions au ton globalement neutre doivent avoir 2-3
réponses qui montent clairement dans ce registre d'escalade, pour respecter le
ratio ~55% absurde sur les réponses (section 8, tableau).

### Ce qui NE change PAS

- Le schéma JSON, les 15 stats, les contraintes de validation (10 réponses/
  question, etc.) — identiques à la section 1-7 ci-dessus.
- Les `idealProfile`/`effects` restent basés sur les mêmes 15 stats avec les
  mêmes magnitudes (-9 à +9 pour les effets, 0-100 pour les profils). Ce qui
  change, c'est UNIQUEMENT le texte affiché (formulation des questions/
  réponses/noms/descriptions), pas la mécanique statistique.
- Les métiers "sérieux/réalistes" (Docteur, Ingénieur...) restent nécessaires
  pour équilibrer le mix — ne pas les supprimer, juste réduire leur proportion
  relative en ajoutant plus de contenu absurde autour.

---

## 9. Pipeline après ajout de contenu (à faire dans cet ordre)

```bash
npm run content:seed          # JSON -> sqlite
npm run content:validate      # vérifie structure, doublons, stats valides, 10 réponses/question
npm run sim:build-baselines   # recalibre le matching normalisé (careers/classes/animals/powers/weaknesses/abilities/workStyles)
npm run sim:build-rarity      # régénère la table de percentiles de rareté
npm run sim:run               # 20 000 profils, vérifie les fréquences (aucun résultat ne doit dominer >15-20%)
npm run build                 # typecheck + build final
```

---

## 10. Prompt prêt à l'emploi pour générer du contenu avec une IA

Copie-colle le bloc ci-dessous (en adaptant le nombre et le type d'entrées) dans
une conversation avec une IA générative pour produire du contenu qui respecte
ce schéma ET le nouveau ratio d'humour :

```
Tu génères du contenu pour un quiz de personnalité viral. Réponds UNIQUEMENT
avec un tableau JSON valide, sans texte autour, sans commentaires (le JSON
standard n'en accepte pas), sans ```json``` autour.

CONTRAINTES STRUCTURELLES OBLIGATOIRES :
- Les 15 stats valides sont EXACTEMENT (casse incluse) : intelligence, humor,
  discipline, luck, social, emotionalControl, creativity, ambition, energy,
  professionalism, communication, financialSense, chaos, risk, empathy.
- Toute clé en dehors de cette liste est invalide.
- Chaque texte doit avoir trois traductions : en, fr, es (naturelles, pas du
  mot-à-mot, adapter l'humour si besoin — une blague qui ne marche pas dans une
  langue doit être remplacée par une équivalente, pas traduite littéralement).

CONTRAINTE ÉDITORIALE — NIVEAU D'HUMOUR (important, c'est le point le plus
souvent raté) :
Le contenu doit être MAJORITAIREMENT absurde et hyper-spécifique, PAS sage ou
générique. Répartis ce que tu génères selon ce ratio pour le type demandé :
[coller la ligne du tableau ci-dessus correspondant au type généré, ex pour
Weaknesses : "5% sérieux, 25% particulier, 70% absurde"].

"Absurde" = ancré dans le réel, jamais de science-fiction ni de pouvoir
surnaturel. L'absurdité vient de l'exagération et de la spécificité
hyperréaliste ("Peut reconnaître la sonnerie de notification de n'importe
quelle app à travers un mur"), jamais de l'impossible ("Peut lire dans les
pensées"). Si un talent nécessite un pouvoir qui n'existe pas dans la réalité,
c'est invalide, recommence.

GÉNÈRE : [N] entrées de type [questions|careers|animals|classes|powers|
weaknesses|abilities|workStyles] au format suivant :

[coller ici le schéma exact de la section correspondante ci-dessus]

Pour les questions : chaque question doit avoir EXACTEMENT 10 réponses, avec
des effets sur 2-5 stats chacune (magnitude -9 à +9), et les 10 réponses
doivent représenter des directions statistiquement différentes (pas 10
variations du même profil). Applique le ratio d'humour aussi bien aux
situations décrites qu'aux réponses proposées.

Pour les métiers/animaux/classes/pouvoirs/capacités/styles de travail : les
idealProfile doivent toucher 2-6 stats avec des valeurs 0-100 cohérentes avec
le concept (ex: un métier de comptable a besoin de financialSense et
discipline élevés, pas de humor ou risk élevés) — même quand le NOM/la
description du métier est absurde, le profil statistique sous-jacent doit
rester logique.
```

Une fois le JSON généré, colle-le dans le fichier correspondant (en fusionnant
avec le contenu existant, jamais en écrasant), puis suis le pipeline de la
section 9 ci-dessus.
