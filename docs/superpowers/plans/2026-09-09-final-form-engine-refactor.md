# Final Form Engine Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stabilize and restructure the Final Form quiz into a deterministic, validated, testable client-only engine whose scoring, synergies, selection, rarity, and UI result model are internally consistent.

**Architecture:** Keep the application 100% client-side and preserve the current React/Vite-style app. Normalize the monorepo so shared types live in a real workspace, make the quiz pipeline explicit (`answers → raw stats → normalized stats → derived stats → synergies → final form`), and enforce invariants at content boundaries and engine boundaries. Use seeded randomness for session generation and simulations; no backend or remote persistence is introduced.

**Tech Stack:** TypeScript, React, existing build/lint tooling, JSON content packs, Vitest if already compatible with the repository toolchain, GitHub Actions for CI where appropriate.

**Spec:** Existing approved in-chat architectural design from 2026-09-09; this plan records the implementation decomposition.

## Global Constraints

- The application remains 100% client-side; no backend, database, authentication, API, or server-side result calculation.
- Preserve the existing visual identity and content unless a change is required to repair a documented logic/data contract.
- Do not increase the question dataset before the engine and simulation invariants pass.
- All public engine outputs must satisfy their documented numeric ranges.
- Same seed + same content + same locale must produce the same generated game and result.
- A completed game must contain exactly `QUESTIONS_PER_GAME` unique questions.
- Scoring must be independent of answer application order.
- Content validation must fail fast on broken references and malformed numeric ranges.
- Every behavioral change gets regression coverage before or alongside implementation.

---

### Task 1: Normalize the workspace structure

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `packages/package.json`
- Create: `packages/shared-types/package.json`
- Move/recreate: `packages/shared-types/src/index.ts`
- Inspect/remove or isolate: `pixeltroll_V2.6 3/`
- Inspect/remove or repair: `content-pipeline/`

**Interfaces:**
- Produces workspace package `@final-form/shared-types` resolvable from the root workspace.
- Root workspace list must contain only directories that exist and are intended to be packages.

- [ ] **Step 1: Add a structural regression check** that resolves every declared workspace path and asserts the shared-types package is located at `packages/shared-types`.
- [ ] **Step 2: Run the package-manager workspace/lint command and capture the current failure caused by the mismatch.**
- [ ] **Step 3: Move the shared-types package to `packages/shared-types/` and update its package metadata without changing exported type names.**
- [ ] **Step 4: Remove the nonexistent `content-pipeline` workspace declaration unless a real directory is present; remove stale lockfile workspace entries through the package manager rather than hand-editing generated lock metadata.**
- [ ] **Step 5: Move the legacy `pixeltroll_V2.6 3/` out of the active application tree or delete it only if it is confirmed to be obsolete; do not import any of its dependencies into Final Form.**
- [ ] **Step 6: Run install, typecheck/build, and lint to prove the workspace is coherent.**
- [ ] **Step 7: Commit `chore: normalize monorepo workspaces`.**

### Task 2: Define explicit stat and result invariants

**Files:**
- Modify: `packages/shared-types/src/index.ts`
- Create: `src/engine/scoring/statInvariants.ts`
- Create: `src/engine/result/resultInvariants.ts`
- Create: `src/engine/scoring/statInvariants.test.ts`
- Create: `src/engine/result/resultInvariants.test.ts`

**Interfaces:**
- `assertStatsInRange(stats): void`
- `assertDerivedStatsInRange(stats): void`
- `assertThreatInRange(value): void`
- `assertFiniteNumber(value, label): void`

- [ ] **Step 1: Write failing tests for finite stats, `0..100` stats, `0..100` derived stats, and `0..10` threat.**
- [ ] **Step 2: Run the focused tests and confirm they fail because the invariant helpers do not exist.**
- [ ] **Step 3: Implement small pure invariant helpers and export only the helpers needed by engine modules.**
- [ ] **Step 4: Run the focused tests and confirm they pass.**
- [ ] **Step 5: Commit `test: define final form engine invariants`.**

### Task 3: Make scoring order-independent

**Files:**
- Modify: `src/engine/scoring/applyAnswerEffects.ts`
- Modify: `src/engine/scoring/clampStats.ts`
- Create: `src/engine/scoring/applyAnswerEffects.test.ts`
- Inspect/update callers in: `src/engine/computeFinalForm.ts`

**Interfaces:**
- `applyAnswerEffects(initialStats, effects[]): Stats` remains the public scoring entry point but applies all deltas before one final normalization/clamp.

- [ ] **Step 1: Write a regression test where applying two answers in opposite orders currently produces different results because an intermediate clamp is hit.**
- [ ] **Step 2: Run the test and verify the current implementation fails the commutativity assertion.**
- [ ] **Step 3: Change the function to aggregate deltas by stat, add them to the initial vector, then clamp once.**
- [ ] **Step 4: Add tests for positive overflow, negative overflow, empty effects, and non-finite effects.**
- [ ] **Step 5: Run the scoring test suite and confirm all cases pass.**
- [ ] **Step 6: Commit `fix: make answer scoring order-independent`.**

### Task 4: Repair weighted derived-stat calculations

**Files:**
- Modify: `src/engine/derivedStats/weightedMix.ts`
- Modify: `src/engine/derivedStats/dangerProfile.ts`
- Modify: `src/engine/result/computeThreatLevel.ts`
- Modify: `src/engine/result/computeLifeExpectancy.ts`
- Create: `src/engine/derivedStats/weightedMix.test.ts`
- Create: `src/engine/result/computeThreatLevel.test.ts`

**Interfaces:**
- `weightedMix` returns a finite normalized `0..100` value whenever all inputs are valid.
- `computeThreatLevel` returns `0..10` for every valid derived profile.

- [ ] **Step 1: Write failing tests using negative weights and extreme inputs that expose out-of-range weighted results.**
- [ ] **Step 2: Run the tests and confirm the existing implementation violates its own documented range.**
- [ ] **Step 3: Normalize the weighted mix according to the intended weighted contribution formula and clamp the public result to `0..100`; reject non-finite input instead of silently producing `NaN`.**
- [ ] **Step 4: Clamp/validate threat after conversion and add tests for both extremes.**
- [ ] **Step 5: Run derived-stat and result tests.**
- [ ] **Step 6: Commit `fix: enforce derived stat ranges`.**

### Task 5: Strengthen content validation

**Files:**
- Modify: `src/engine/content/validate.ts`
- Modify: `src/data/index.ts`
- Create: `src/engine/content/validate.test.ts`
- Inspect: `src/data/questions.json`
- Inspect: `src/data/synergyRules.json`
- Inspect: `src/data/matchBaselines.json`
- Inspect all result tables under `src/data/`

**Interfaces:**
- `assertContentPackIsValid(pack)` must reject malformed content before the quiz engine uses it.

- [ ] **Step 1: Add failing validation tests for duplicate IDs, unknown stat keys, invalid effect values, duplicate question IDs, malformed synergies, missing baselines, zero/negative baseline standard deviations, invalid rarity ordering, and empty result tables.**
- [ ] **Step 2: Run validation tests and confirm the missing checks fail.**
- [ ] **Step 3: Implement deterministic structural validation with actionable error messages naming the file/entity/id and invalid field.**
- [ ] **Step 4: Call content validation during application content initialization so invalid bundled data cannot reach gameplay.**
- [ ] **Step 5: Add a content-validation package script usable in CI.**
- [ ] **Step 6: Run validation against the real data pack and fix all existing data errors rather than weakening validators.**
- [ ] **Step 7: Commit `fix: validate final form content contracts`.**

### Task 6: Guarantee question selection count and balance

**Files:**
- Modify: `src/engine/selection/selectQuestions.ts`
- Create: `src/engine/selection/selectQuestions.test.ts`
- Modify: `src/state/useQuizEngine.ts`

**Interfaces:**
- `selectQuestions(pool, count, rng)` always returns exactly `count` unique questions when the pool contains at least `count` eligible questions; otherwise it throws a descriptive error.

- [ ] **Step 1: Write failing tests where category caps exhaust the first selection pass before reaching the requested count.**
- [ ] **Step 2: Run the tests and confirm the selector can return too few questions.**
- [ ] **Step 3: Add a deterministic backfill phase that selects from unused eligible questions while preserving category balance as closely as possible.**
- [ ] **Step 4: Add tests for insufficient pools, duplicate prevention, deterministic seeded selection, and balanced categories.**
- [ ] **Step 5: Run focused selection tests.**
- [ ] **Step 6: Commit `fix: guarantee balanced quiz question selection`.**

### Task 7: Make answer selection honor editorial weights and diversity

**Files:**
- Modify: `src/engine/selection/selectAnswers.ts`
- Create: `src/engine/selection/selectAnswers.test.ts`
- Modify: shared/content types if answer metadata needs a typed semantic category

**Interfaces:**
- `selectAnswers` must use `selectionWeight` as an editorial prior while retaining effect-vector diversity.
- Optional semantic answer metadata must be validated and deterministic.

- [ ] **Step 1: Write a failing test proving `selectionWeight` currently has no influence.**
- [ ] **Step 2: Run the test and confirm it fails against the current selector.**
- [ ] **Step 3: Incorporate normalized selection weights into candidate choice without allowing one high-weight answer to eliminate all diversity.**
- [ ] **Step 4: Add tests for diversity, weight influence, duplicate prevention, and deterministic RNG.**
- [ ] **Step 5: Run the selector suite.**
- [ ] **Step 6: Commit `fix: use answer selection weights`.**

### Task 8: Rebuild the synergy pipeline as a first-class stage

**Files:**
- Modify: `src/engine/synergy/evaluateCondition.ts`
- Modify: `src/engine/synergy/evaluateRules.ts`
- Modify: `src/engine/synergy/aggregateMatches.ts`
- Modify: `src/engine/synergy/computeExtremityScore.ts`
- Modify: `src/engine/computeFinalForm.ts`
- Create: `src/engine/synergy/synergyPipeline.test.ts`

**Interfaces:**
- Synergy evaluation returns a typed `SynergyProfile` containing matched rules, tags, dominant rule, and separate extremity/statistical signals.
- `computeFinalForm` passes the synergy profile into result matchers instead of computing it and discarding most of it.

- [ ] **Step 1: Write failing tests proving a matched synergy currently does not influence the downstream result profile.**
- [ ] **Step 2: Run the tests and confirm the current pipeline disconnect.**
- [ ] **Step 3: Define a typed synergy profile and make rule aggregation deterministic, including stable dominant-rule tie breaking.**
- [ ] **Step 4: Pass synergy context into the result computation stage and apply only explicit, validated synergy modifiers.**
- [ ] **Step 5: Keep statistical extremity separate from synergy rarity so the two concepts cannot silently substitute for each other.**
- [ ] **Step 6: Add regression tests for no synergy, one synergy, multiple synergies, tie cases, and conflicting modifiers.**
- [ ] **Step 7: Run the full engine test suite.**
- [ ] **Step 8: Commit `feat: connect synergies to final form computation`.**

### Task 9: Harden result matching and rarity

**Files:**
- Modify: `src/engine/result/profileMatch.ts`
- Modify: `src/engine/result/computeCareer.ts`
- Modify: `src/engine/result/computeRarity.ts`
- Modify: `src/engine/result/computeAlignment.ts`
- Modify: `src/engine/result/computeWorth.ts`
- Create: `src/engine/result/profileMatch.test.ts`
- Create: `src/engine/result/computeRarity.test.ts`
- Create: `src/engine/result/computeWorth.test.ts`

**Interfaces:**
- Result matchers require valid baselines rather than silently switching to incompatible raw-distance scoring.
- Rarity is deterministic for a profile and explicitly combines statistical and synergy/narrative signals.
- Worth has a deterministic base component with only bounded cosmetic variance if variance is retained.

- [ ] **Step 1: Write tests for missing baselines, zero standard deviations, empty rarity tables, unsorted rarity thresholds, identical profiles, and repeated worth computation.**
- [ ] **Step 2: Run tests to expose the current unsafe fallbacks/randomness.**
- [ ] **Step 3: Make missing/invalid baselines a content-validation error and simplify runtime matching to the validated z-score path.**
- [ ] **Step 4: Make rarity selection safe and deterministic; define explicit threshold ordering and final clamping.**
- [ ] **Step 5: Replace uncontrolled worth randomness with a deterministic profile-derived value plus a small optional seeded flavor offset.**
- [ ] **Step 6: Run focused result tests and the full engine suite.**
- [ ] **Step 7: Commit `fix: harden result matching rarity and worth`.**

### Task 10: Introduce seeded game sessions and fix reset behavior

**Files:**
- Modify: `src/state/useQuizEngine.ts`
- Modify: `src/engine/selection/selectQuestions.ts`
- Modify: `src/engine/selection/selectAnswers.ts`
- Create: `src/engine/random/seededRng.ts`
- Create: `src/engine/random/seededRng.test.ts`
- Create: `src/state/useQuizEngine.test.ts`

**Interfaces:**
- `createSeededRng(seed)` returns the existing RNG interface expected by selectors.
- `buildGameSession(seed, content, locale)` returns a reproducible set of rounds.
- `reset()` creates a new session rather than reusing the previous round array.

- [ ] **Step 1: Write a failing state regression test showing `reset()` currently reuses the same generated rounds.**
- [ ] **Step 2: Write deterministic RNG tests proving equal seeds produce equal sequences and different seeds diverge.**
- [ ] **Step 3: Implement the seeded RNG using a small dependency-free deterministic algorithm.**
- [ ] **Step 4: Refactor round generation into a pure session builder that receives the seed and content.**
- [ ] **Step 5: Update reset to generate a fresh seed/session and clear all transient state.**
- [ ] **Step 6: Run state and engine tests.**
- [ ] **Step 7: Commit `fix: make quiz sessions reproducible and resettable`.**

### Task 11: Define a single FinalForm result model

**Files:**
- Modify: `packages/shared-types/src/index.ts`
- Modify: `src/engine/computeFinalForm.ts`
- Modify: all result calculators as required by the new model
- Create: `src/engine/computeFinalForm.test.ts`

**Interfaces:**
- `FinalForm` groups identity, combat, meta, stats, derived stats, and synergies while preserving backward-compatible leaf fields during migration if UI components still consume them.

- [ ] **Step 1: Write an end-to-end engine test asserting every declared result field is finite/valid and synergies are represented in the final form.**
- [ ] **Step 2: Implement the grouped model without duplicating computed values; use a single source of truth for each field.**
- [ ] **Step 3: Add compatibility accessors only where existing UI code needs them during migration.**
- [ ] **Step 4: Run the end-to-end engine suite against real bundled content.**
- [ ] **Step 5: Commit `refactor: centralize final form result model`.**

### Task 12: Improve the result UI to expose the repaired engine

**Files:**
- Modify: `src/ui/result/FinalFormCard.tsx`
- Modify: `src/ui/result/AnalyzingScreen.tsx`
- Modify: `src/ui/quiz/QuestionCard.tsx`
- Modify: `src/ui/quiz/AnswerButton.tsx`
- Modify: `src/styles/theme.css`
- Create/modify UI tests where the existing test stack supports them

**Interfaces:**
- UI consumes only the final-form contract and does not recompute engine logic.

- [ ] **Step 1: Add a UI regression check for all important final-form sections: career/class, power, weakness, ability, work style, animal, alignment, aura, threat, worth, rarity, stats, and synergy signal.**
- [ ] **Step 2: Update the result card to use the grouped model and expose currently computed-but-hidden fields.**
- [ ] **Step 3: Replace the repetitive progress-dot treatment with a compact numeric/segmented progress indicator while preserving accessibility.**
- [ ] **Step 4: Make the analyzing screen steps correspond to real pipeline stages and add `aria-live` for status changes.**
- [ ] **Step 5: Widen the desktop stage without sacrificing the compact mobile layout; reduce repetitive static decoration and strengthen the poster/character-sheet hierarchy.**
- [ ] **Step 6: Run build/lint and any available UI tests.**
- [ ] **Step 7: Commit `feat: surface final form engine in result UI`.**

### Task 13: Add property-style engine tests and simulation quality gates

**Files:**
- Modify: `simulation/*`
- Create: `src/engine/invariants/finalFormInvariants.test.ts`
- Create: `simulation/quality-gates.ts`
- Modify: root `package.json`

**Interfaces:**
- Simulation accepts a seed and produces aggregate metrics without network/backend dependencies.
- Quality gates fail when engine invariants or distribution thresholds are violated.

- [ ] **Step 1: Write tests over many seeded games for stat ranges, result ranges, unique question counts, finite values, and deterministic replay.**
- [ ] **Step 2: Run them and capture baseline distribution metrics.**
- [ ] **Step 3: Implement simulation quality gates for unreachable results, overrepresented results, never-triggered synergies, and suspiciously dominant answers.**
- [ ] **Step 4: Add a reproducible simulation command accepting a seed/count configuration.**
- [ ] **Step 5: Run the simulation and fix content/engine defects surfaced by it.**
- [ ] **Step 6: Commit `test: add seeded simulation quality gates`.**

### Task 14: CI, documentation, and final verification

**Files:**
- Modify: `README.md`
- Modify: root `package.json`
- Create/modify: `.github/workflows/*` as appropriate
- Create: `docs/architecture/final-form-engine.md`

**Interfaces:**
- CI runs validation, tests, lint, build, and deterministic simulation quality gates.

- [ ] **Step 1: Update README numbers and architecture descriptions so they match the real dataset and workspace structure.**
- [ ] **Step 2: Document the canonical pipeline, stat semantics, synergy flow, deterministic session model, and content validation rules.**
- [ ] **Step 3: Add CI commands in dependency order: install → content validation → tests → lint → build → simulation quality gates.**
- [ ] **Step 4: Run every local verification command from a clean checkout/working tree state where possible.**
- [ ] **Step 5: Inspect the final diff for accidental backend/dependency additions, stale references, and dead code.**
- [ ] **Step 6: Commit `chore: document and verify final form architecture`.**

---

## Final verification checklist

- [ ] Root workspaces resolve without phantom packages.
- [ ] Shared types resolve from the real workspace path.
- [ ] Content validation passes the bundled data.
- [ ] Exactly 20 unique questions are generated for every valid session.
- [ ] `selectionWeight` affects answer selection.
- [ ] Answer scoring is order-independent.
- [ ] All stats and derived stats stay within `0..100`.
- [ ] Threat stays within `0..10`.
- [ ] Missing baselines cannot silently degrade matching quality.
- [ ] Synergies influence the final profile through an explicit typed path.
- [ ] Rarity distinguishes statistical extremity from synergy/narrative rarity.
- [ ] Worth is reproducible for a given profile/seed.
- [ ] Reset generates a fresh session.
- [ ] Same seed reproduces the same game/result.
- [ ] Result UI exposes the important computed fields.
- [ ] No backend or server dependency was introduced.
- [ ] Lint, tests, build, content validation, and simulation quality gates pass.
