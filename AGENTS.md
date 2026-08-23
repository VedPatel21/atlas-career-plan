# ATLAS repository guide

ATLAS is a local-first career GPS for progressing toward professional Software, ML, and AI Engineering. It maps current position → prerequisite → capability → self-assessed completion → readiness → next dependency. It is not a course platform, daily timetable, productivity tracker, or calendar-driven checklist.

## Architecture

- `index.html` contains the accessible application shell, 6 streamlined navigation views (Overview, Career Map, Projects, Careers, Learn / Resources, Education & Canada), and semantic sections.
- `styles.css` contains the preserved ATLAS dark/light visual system, responsive layout, task recipe cards, lab layouts, YouTube course cards, and career components.
- `data.js` is the structured product/content registry: phases, competency nodes with hands-on labs & completion checks, YouTube learning registry, AI-native engineering rules, projects, dynamic roles, opportunities, resources, education metadata, and trajectory.
- `state.js` owns versioned localStorage (`stateVersion: 2`, `roadmapVersion: '2.4.0'`), `workingNodeId` manual pinning, safe normalization/migration, notes, resource verification, checkpoints, export/import, and reset.
- `app.js` renders learner-guided task recipes, hands-on labs, YouTube courses, dynamic role readiness, and interactive controls without rigid automated mission locks.
- `MASTER_CAREER_PLAN.md` is the repository copy of the authoritative detailed career-plan specification.
- `MASTER_EDUCATION_CANADA_PLAN.md` is the separate authoritative Education / Canada strategic specification.

Keep the app dependency-free, static, fast, portable, accessible, and easy to understand. Do not add React, a backend, accounts, a database, cloud services, or build tooling without a demonstrated need.

## Run and verify

Serve this directory with any static server, for example:

```sh
python3 -m http.server 4173
```

Then open `http://localhost:4173`. Syntax checks can use `node --check data.js state.js app.js`; the integration smoke test is `node tests/smoke.test.js`.

## State rules

- Current storage key: `atlas-career-architecture-v2` with explicit `schemaVersion: 2` and `roadmapVersion: '2.4.0'`.
- Preserve local-first behavior, theme, progress, notes, working task pin (`workingNodeId`), resource verification, checkpoints, and backups.
- Never silently discard or reinterpret legacy state. Old checkbox records are preserved verbatim in `legacyBackup`.
- Imports must be normalized to the current schema. Reset must download a backup first and require explicit confirmation.
- Baseline capability coverage and post-ATLAS action completion are distinct concepts. Never combine approved starting evidence with newly completed ATLAS actions into one task-like score.

## Execution UX rules (ATLAS v2.4)

- **Learner-Guided Navigation**: 6 primary destinations (Overview, Career Map, Projects, Careers, Learn / Resources, Education & Canada).
- **Manual Task Pinning**: The user can pin any capability to the dashboard (`workingNodeId`) via "Work on this". UI rendering is not locked to procedural mission queues.
- **Task Recipe 12-Part Structure**:
  1. What is this?
  2. Why does this matter?
  3. Where does this fit? (Why now)
  4. Prerequisites
  5. Watch First (Verified video or `NEEDS VIDEO VERIFICATION`)
  6. Learn Free on YouTube (Verified playlist/course with selected chapters)
  7. Official & Reference Resources
  8. Build This (Hands-On Lab with title, goal, 3-7 steps, expected result, stretch challenge)
  9. Explain It (Technical articulation prompt)
  10. What to Skip
  11. Completion Check (Self-assessment checkbox replacing proof upload)
  12. What this unlocks
- **AI-Native Engineering**: AI is a permanent acceleration tool, but an AI-independent technical floor (explaining architecture, debugging root causes, writing tests, threat-modeling, justifying trade-offs) remains mandatory.
- **Dynamic Role Readiness**: Role fit (`APPLY NOW`, `APPLY SELECTIVELY`, `PREPARE FIRST`, `NOT YET`) is calculated dynamically from completed prerequisites and projects, explaining why each status is given.
- **Verified Opportunities**: Official dates and eligibility criteria (Mitacs GRI 2027 institutional check deadline 16 Sep 2026, MLH Fall 2026, GSoC 2027 "NOT YET PUBLISHED / REVERIFY in Q4 2026" with AI policy warning, LFX Mentorship).

## Product invariants

- Software Engineering Core unlocks serious ML; Professional SWE Depth continues horizontally in parallel.
- Project 1 upgrades the best authentic existing project (Pawnstone Vault preferred; ReSource Relay is an optional greenfield backup).
- Project 2 is domain-flexible (Recommended example: CivicPulse).
- Project 3 productionizes whichever Project 2 was built.
- Project 4 is domain-flexible (Recommended example: RoadSight) with mandatory hands-on PyTorch model construction/adaptation/training, evaluation, and debugging. Hosted inference APIs alone do not qualify.
- Project 5 benchmarks ATLAS Context Engine / RepoScope for repository intelligence specialization.
- Education / Canada is a secondary strategic reference. It remains dynamic for policy-sensitive info and never dictates technical progression.

## Source-of-truth precedence

When content conflicts, use: newest Canada micro-corrections > seven approved Canada patches > Education / Canada Master Layer > two Career micro-corrections > five Career patches > original Career Architecture v2 > old ATLAS content. Update structured records in `data.js` rather than hard-wiring content into rendering logic.
