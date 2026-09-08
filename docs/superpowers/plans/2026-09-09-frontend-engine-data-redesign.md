# Frontend Engine & Data Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stabilize the existing Final Form Quiz engine and complete its planned static monorepo architecture while making the result experience substantially richer, reproducible, testable, and visually expressive.

**Architecture:** Keep the browser as the only production runtime. Source content is validated and transformed offline by `content-pipeline`, generated artifacts are committed under `generated/`, the browser consumes those artifacts through `src/data`, and `simulation` exercises the same engine offline for balance reports. No backend, API, database, server action, authentication service, or remote persistence is introduced.

**Tech Stack:** React, TypeScript, Vite, existing JSON content, npm workspaces, Node-based offline pipeline/simulation, GitHub Actions, CSS.

**Spec:** `docs/superpowers/specs/2026-09-09-frontend-engine-data-redesign.md`

## Global Constraints

- Production remains 100% frontend/static.
- Every completed game contains exactly 20 questions.
- A new game gets a fresh seed and fresh ordering; the seed remains part of the result.
- Generated rarity and baselines are authoritative runtime data.
- Invalid content fails validation/build rather than being silently repaired at runtime.
- Public score contracts remain finite and inside their documented ranges.
- Offline pipeline/simulation code is never imported into the browser bundle.
- Existing content model and planned monorepo architecture are preserved rather than replaced by a simplified app.
- UI exposes existing engine calculations; it does not invent unrelated scoring.

---

### Task 1: Restore and formalize the workspace architecture

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `packages/shared-types/package.json`
- Create: `packages/shared-types/src/index.ts`
- Create: `content-pipeline/package.json`
- Create: `content-pipeline/src/index.ts`
- Create: `simulation/package.json`
- Create: `simulation/src/index.ts`
- Create: `generated/contentManifest.json`

**Interfaces:**
- `@final-form/shared-types` exports the shared domain contracts consumed by runtime/tooling.
- `content-pipeline` exposes an npm script that validates and generates runtime artifacts.
- `simulation` exposes an npm script that runs offline simulation checks.

- [ ] **Step 1: Write failing workspace smoke tests** proving the workspace package can be resolved and the runtime package can import shared types.
- [ ] **Step 2: Run the workspace typecheck/build and observe the expected missing-package failures.**
- [ ] **Step 3: Add the minimal shared-types package and workspace package manifests.**
- [ ] **Step 4: Add pipeline/simulation entry points that do not import browser-only modules.**
- [ ] **Step 5: Regenerate the lockfile from the restored workspace graph.**
- [ ] **Step 6: Run typecheck/build again and verify workspace resolution.**
- [ ] **Step 7: Commit the workspace restoration separately.**

---

### Task 2: Make content validation authoritative

**Files:**
- Modify: `src/data/index.ts`
- Create: `content-pipeline/src/validators/contentPack.ts`
- Create: `content-pipeline/src/validators/references.ts`
- Create: `content-pipeline/src/validators/numbers.ts`
- Create: `tests/data/contentPack.validation.test.ts`

**Interfaces:**
- `validateContentPack(pack): ValidationResult` returns all validation errors without mutating input.
- Validation checks IDs, references, stat keys, finite numbers, documented ranges, positive standard deviations, weights, alignments, localizations, and synergy references.

- [ ] **Step 1: Add tests for duplicate IDs, dangling references, unknown stat keys, invalid ranges, zero/invalid std, empty alignments, invalid localization entries, and malformed synergies.**
- [ ] **Step 2: Run those tests and confirm they fail against the current permissive validator.**
- [ ] **Step 3: Implement focused validation functions.**
- [ ] **Step 4: Make the content pipeline fail non-zero when validation returns errors.**
- [ ] **Step 5: Call the same validator for the checked-in runtime pack without duplicating validation logic.**
- [ ] **Step 6: Run the validator against the current real content and fix any genuine data errors exposed by it.**
- [ ] **Step 7: Commit the validation layer.**

---

### Task 3: Generate authoritative runtime artifacts

**Files:**
- Create: `content-pipeline/src/generators/contentManifest.ts`
- Create: `content-pipeline/src/generators/matchBaselines.ts`
- Create: `content-pipeline/src/generators/rarityDistribution.ts`
- Create: `content-pipeline/src/generators/index.ts`
- Modify: `src/data/rarityDistribution.json`
- Create: `generated/contentManifest.json`
- Create: `generated/matchBaselines.json`
- Create: `generated/rarityDistribution.json`
- Create: `tests/data/generated-artifacts.test.ts`

**Interfaces:**
- Generators accept validated content and deterministic options and return serializable artifacts.
- `generated/rarityDistribution.json` is the single production rarity table.
- The manifest contains generator/content versions and entity counts.

- [ ] **Step 1: Add tests proving generated artifacts are deterministic for a fixed content version and seed/options.**
- [ ] **Step 2: Run them and verify they fail because generation is not currently wired.**
- [ ] **Step 3: Implement generators using the existing data model and simulation-derived baseline calculations.**
- [ ] **Step 4: Write generated artifacts to `generated/` and make runtime imports use them.**
- [ ] **Step 5: Ensure production result calculation receives the generated rarity table explicitly and no valid production path silently falls back.**
- [ ] **Step 6: Run artifact tests and inspect generated counts against the actual content.**
- [ ] **Step 7: Commit generated-data wiring.**

---

### Task 4: Make game runs exact, fresh, and reproducible

**Files:**
- Modify: `src/engine/game/useQuizEngine.ts`
- Modify: `src/engine/selection/selectQuestions.ts`
- Modify: `src/engine/selection/selectAnswers.ts`
- Create: `src/engine/game/random.ts`
- Create: `src/engine/game/createGameRun.ts`
- Create: `tests/engine/game/gameRun.test.ts`
- Create: `tests/engine/selection/selectQuestions.test.ts`
- Create: `tests/engine/selection/selectAnswers.test.ts`

**Interfaces:**
- `createSeed(): number` creates a fresh run seed.
- `createGameRun(contentPack, seed, questionCount=20): GameRun` returns exactly 20 selected questions and deterministic answer ordering.
- Selection functions accept an explicit RNG so simulation and runtime share reproducible behavior.

- [ ] **Step 1: Add failing tests for exactly 20 questions even when category caps would otherwise discard candidates.**
- [ ] **Step 2: Add failing tests that two runs have different seeds while two runs with the same seed have identical selection/order.**
- [ ] **Step 3: Add failing tests proving answer `selectionWeight` affects selection while effect-vector diversity prevents redundant choices.**
- [ ] **Step 4: Run the tests and observe failures.**
- [ ] **Step 5: Implement seeded RNG and a two-pass/fallback question selector that preserves category balancing without dropping requested slots.**
- [ ] **Step 6: Implement weighted + diversity-aware answer selection using explicit RNG.**
- [ ] **Step 7: Rebuild rounds on reset/new game rather than keeping the original mounted array.**
- [ ] **Step 8: Retain the seed in the result/run state.**
- [ ] **Step 9: Run game tests and commit.**

---

### Task 5: Harden scoring, normalization, threats, and synergies

**Files:**
- Modify: `src/engine/result/profileMatch.ts`
- Modify: `src/engine/result/computeWeakness.ts`
- Modify: `src/engine/result/weightedMix.ts`
- Modify: `src/engine/result/computeThreatLevel.ts`
- Modify: `src/engine/result/computeDangerProfile.ts`
- Modify: `src/engine/result/computeLifeExpectancy.ts`
- Modify: `src/engine/result/aggregateMatches.ts`
- Modify: `src/engine/result/computeAlignment.ts`
- Create: `src/engine/result/scoreUtils.ts`
- Create: `tests/engine/result/scoring-invariants.test.ts`

**Interfaces:**
- `safeZScore(distance, mean, std): number` never returns NaN/Infinity and uses a documented fallback when std is invalid.
- `clampFinite(value, min, max, fallback): number` is used at public score boundaries.
- Inverse dimensions are transformed explicitly before weighted mixes.
- Synergy aggregation applies bounded/diminishing contribution.

- [ ] **Step 1: Add invariant tests for finite values, 0–100 stats, 0–10 threat/danger, zero std, missing baselines, and negative-weight cases.**
- [ ] **Step 2: Add tests showing overlapping synergy rules cannot exceed the documented aggregate cap.**
- [ ] **Step 3: Add a safe empty-alignment runtime test even though invalid content is rejected at build time.**
- [ ] **Step 4: Run and observe the failures.**
- [ ] **Step 5: Implement shared finite/clamp/normalization utilities and refactor scoring functions to use them.**
- [ ] **Step 6: Replace negative-weight range hacks with explicit inverse transforms.**
- [ ] **Step 7: Add diminishing/capped synergy contribution while preserving rule identity in the result.**
- [ ] **Step 8: Run the invariant suite and commit.**

---

### Task 6: Make rarity and worth reproducible

**Files:**
- Modify: `src/engine/result/computeFinalForm.ts`
- Modify: `src/engine/result/computeRarity.ts`
- Modify: `src/engine/result/computeWorth.ts`
- Create: `src/engine/result/resultSeed.ts`
- Create: `tests/engine/result/reproducibility.test.ts`

**Interfaces:**
- `createResultSeed(runSeed, answers): number` deterministically derives result randomness from the run.
- `computeFinalForm(..., options)` requires an explicit rarity table for production calls.

- [ ] **Step 1: Add a test proving identical seed + answers + content produce identical worth/rarity.**
- [ ] **Step 2: Add a test proving different seeds can produce different pseudo-random worth flavor without changing deterministic scoring.**
- [ ] **Step 3: Run and observe failure caused by direct `Math.random` and optional rarity fallback.**
- [ ] **Step 4: Implement deterministic RNG injection into worth calculation.**
- [ ] **Step 5: Make the generated rarity table a required production dependency and reserve fallback only for explicitly isolated development/test helpers.**
- [ ] **Step 6: Run reproducibility tests and commit.**

---

### Task 7: Build offline simulation and balance reports

**Files:**
- Create: `simulation/src/engine/runSimulation.ts`
- Create: `simulation/src/scenarios/defaultScenario.ts`
- Create: `simulation/src/reports/balanceReport.ts`
- Create: `simulation/src/reports/reachabilityReport.ts`
- Create: `simulation/src/index.ts`
- Create: `tests/simulation/simulation.invariants.test.ts`
- Create: `generated/balanceReport.json`

**Interfaces:**
- `runSimulation({ games, seed }): SimulationReport` runs the same browser engine with deterministic RNG but remains a Node-only tool.
- Report includes question count, finite-score checks, rarity reachability, entity reachability, and score distributions.

- [ ] **Step 1: Add simulation invariant tests against a small deterministic sample.**
- [ ] **Step 2: Run them and confirm the missing simulation implementation fails.**
- [ ] **Step 3: Implement the simulation runner using shared engine functions and explicit seeds.**
- [ ] **Step 4: Generate JSON balance/reachability reports without importing simulation code into `src/`.**
- [ ] **Step 5: Run a representative simulation and fix balance/content issues revealed by real data.**
- [ ] **Step 6: Commit simulation/report generation.**

---

### Task 8: Add regression tests and CI gates

**Files:**
- Create: `.github/workflows/quality.yml`
- Create: `tests/engine/game/engine-regressions.test.ts`
- Create: `tests/engine/result/result-regressions.test.ts`
- Modify: `package.json`

**Interfaces:**
- `npm run validate` validates content.
- `npm run test` executes the full test suite.
- `npm run simulation:check` runs deterministic simulation invariants.
- `npm run build` builds only the static frontend.

- [ ] **Step 1: Add regression tests for the original issues: repeated Try Again questions, fewer-than-20 runs, ignored selection weights, rarity not wired, NaN/Infinity, negative threat, and zero std.**
- [ ] **Step 2: Run them and verify the intended regressions fail before their fixes are present.**
- [ ] **Step 3: Wire npm scripts and the GitHub Actions sequence `validate → typecheck → tests → simulation checks → build`.**
- [ ] **Step 4: Ensure CI does not start or deploy any application backend.**
- [ ] **Step 5: Run the complete local command set and inspect output.**
- [ ] **Step 6: Commit CI and regression coverage.**

---

### Task 9: Redesign the result reveal and explanation UI

**Files:**
- Modify: `src/ui/result/AnalyzingScreen.tsx`
- Modify: `src/ui/result/FinalFormCard.tsx`
- Create: `src/ui/result/ResultReveal.tsx`
- Create: `src/ui/result/ResultExplanation.tsx`
- Create: `src/ui/result/MatchGrid.tsx`
- Create: `src/ui/result/RarityPanel.tsx`
- Create: `src/ui/result/FormId.tsx`
- Modify: `src/i18n/useTranslation.ts`

**Interfaces:**
- Result UI consumes the existing result model plus deterministic form ID and explanation metadata.
- Reveal is staged: analysis → form → stats → explanation → matches → rarity/worth → share ID.

- [ ] **Step 1: Add component-level tests for each reveal stage and result sections.**
- [ ] **Step 2: Implement staged result presentation without changing engine calculations.**
- [ ] **Step 3: Surface why the profile matched, top stats, weaknesses, synergies, rarity, worth, and form identifier.**
- [ ] **Step 4: Centralize analysis strings in i18n instead of maintaining a duplicate locale array.**
- [ ] **Step 5: Verify keyboard navigation and reduced-motion behavior for the reveal.**
- [ ] **Step 6: Commit result UX.**

---

### Task 10: Rework quiz interaction and accessibility

**Files:**
- Modify: `src/ui/quiz/AnswerButton.tsx`
- Modify: `src/ui/quiz/ProgressBar.tsx`
- Modify: `src/App.tsx`
- Modify: `src/i18n/detectLocale.ts`
- Modify: `index.html`

**Interfaces:**
- Answer selection is locked for the transition frame so one click can advance only once.
- Progress uses semantic `role="progressbar"` with current/total values.
- Document language follows the detected locale.
- Metadata/title/theme color remain static-host compatible.

- [ ] **Step 1: Add interaction/accessibility tests for double click, progress semantics, and locale updates.**
- [ ] **Step 2: Implement transition locking and accessible progress semantics.**
- [ ] **Step 3: Set `document.documentElement.lang` from the existing locale system.**
- [ ] **Step 4: Add useful static metadata and ensure no metadata requires a backend.**
- [ ] **Step 5: Run UI tests and commit.**

---

### Task 11: Apply the Dark Pop Art visual system

**Files:**
- Modify: `src/styles/theme.css`
- Modify: `src/ui/quiz/*.tsx` as needed for composition
- Modify: `src/ui/result/*.tsx` as needed for composition
- Modify: `src/App.tsx`

**Interfaces:**
- Visual styles remain presentation-only and do not alter engine/data behavior.
- Decorative elements react to question/result state instead of rendering a static dot field.

- [ ] **Step 1: Add visual regression-friendly component states for intro, quiz, analysis, reveal, and final result.**
- [ ] **Step 2: Replace the existing static decorative treatment with bold blocks, asymmetric composition, typography, restrained texture, and state-reactive accents.**
- [ ] **Step 3: Remove unnecessary gradients where they conflict with the chosen visual language.**
- [ ] **Step 4: Ensure responsive layouts at mobile/tablet/desktop widths and respect `prefers-reduced-motion`.**
- [ ] **Step 5: Verify the visual result in a real browser preview and commit.**

---

### Task 12: Documentation and final verification

**Files:**
- Modify: `README.md`
- Modify: `package.json` if command/documentation drift remains
- Modify: `docs/superpowers/specs/2026-09-09-frontend-engine-data-redesign.md` only if implementation reveals an approved contract correction

- [ ] **Step 1: Update README counts/commands/architecture so it matches the generated manifest and actual runtime.**
- [ ] **Step 2: Document that `content-pipeline` and `simulation` are offline development tooling and that production is static-only.**
- [ ] **Step 3: Run the full verification command set: validation, typecheck, tests, simulation checks, and production build.**
- [ ] **Step 4: Inspect the final diff and confirm no backend/API/database/server-action code was introduced.**
- [ ] **Step 5: Run the browser verification against the production build and check console errors, core quiz flow, Try Again, result reveal, and responsive layout.**
- [ ] **Step 6: Request code review and resolve review findings before integration.**
- [ ] **Step 7: Commit the final documentation/verification changes.**
