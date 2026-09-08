# Frontend Engine & Data Redesign

## Goal
Stabilize and enrich the existing Final Form Quiz architecture while keeping production 100% frontend/static: no application backend, API, database, authentication service, or server-side runtime is required by the deployed game.

## Product direction
The engine should feel substantially more sophisticated than the UI exposes today. The refactor therefore preserves the existing content model and planned monorepo architecture, makes generated data authoritative, guarantees reproducible game runs, and turns the result into the main reward moment.

## Architecture

```text
content/ source data
      |
      v
content-pipeline/ ---- validation + generation + reports
      |
      v
generated/ ---------- versioned runtime artifacts
      |
      v
src/data + src/engine - browser-only game runtime
      |
      v
React UI
```

`content-pipeline` and `simulation` are development/build tooling only. The deployed application consumes static generated assets and performs all quiz calculations in the browser.

## Required behavior

### Game engine
- Every completed game contains exactly 20 questions.
- Question selection uses category balancing without silently losing requested slots.
- A new game creates a fresh seed and fresh question/answer ordering.
- The run seed is retained in the result so a result can be reproduced from the same inputs.
- Answer selection combines declared `selectionWeight` with effect-vector diversity and avoids redundant choices.
- Rapid repeated answer clicks cannot advance the game twice.

### Scoring and matching
- Stats remain finite and are clamped to their documented ranges.
- Threat/danger calculations cannot produce negative or non-finite values when their public contract is 0-10 or 0-100.
- Weighted mixes explicitly handle inverse stats rather than relying on negative weights to imply a range.
- Profile/weakness normalization handles missing baselines and zero/invalid standard deviations safely.
- Matching uses the generated baseline artifacts consistently.
- Synergy stacking has bounded/diminishing contribution so overlapping rules cannot dominate the result.
- Empty alignment data is handled as invalid content at validation time and safely at runtime.

### Rarity and worth
- `generated/rarityDistribution.json` is the authoritative production rarity table.
- Production result calculation must receive the generated rarity table explicitly; silent fallback is not allowed for a valid production content pack.
- Worth retains pseudo-random flavor but is reproducible from the run seed/result inputs.
- Rarity/worth explanations are exposed to the result UI.

### Data integrity
- Content validation runs when generating the runtime pack and fails the build for invalid data.
- IDs are unique and references point to existing entities.
- Stat keys, numeric ranges, standard deviations, baselines, weights, alignments, localization entries, and synergy references are validated.
- A generated manifest records content and generator versions plus counts.

### Simulation
- Simulation runs entirely offline during development/CI.
- It produces balance/range/reachability reports.
- It checks question count, finite values, reachable rarity buckets, and unreachable result entities.

### Testing and CI
- Engine behavior is covered with unit tests and invariant/property-style tests where useful.
- CI runs validation, typecheck, tests, simulation checks, and production build.
- No CI step introduces a production backend.

## Result UX

The result experience is a staged reveal:
1. analysis/calibration;
2. final-form reveal;
3. core stats;
4. explanation of why the profile was selected;
5. career/class/animal/power/weakness/synergy matches;
6. rarity and worth;
7. shareable form identifier.

The UI should surface the engine's existing richness instead of inventing unrelated scoring.

## Visual direction

Dark Pop Art / editorial graphic design with strong typography, asymmetric composition, bold blocks and restrained texture. Decorative elements should react to game state/result rather than being a static field of dots. Avoid generic AI-looking decorative patterns and unnecessary gradients. The visual layer remains separate from engine/data logic.

## Static-only constraint

Production must not require:
- a custom backend;
- REST/GraphQL endpoints;
- server actions or server-side game calculations;
- a database;
- user accounts;
- remote persistence.

Static hosting remains a supported deployment model.
