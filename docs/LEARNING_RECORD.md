# Mechanism Canvas Learning Record

The Learning Record is a local, active-exercise evidence package for learner reflection and instructor review. It does not add accounts, grades, uploads, a second validator, or agent-authored reflections.

## User flow

1. A learner checks and commits an authored mechanism step.
2. The Learning Record opens a reflection editor for that exact commit.
3. Saving the note appends a `reflection_saved` activity event without changing `mechanismRevision` or restoring a validation token.
4. Undo keeps the note attached to the reversed commit. Recommitting creates a new record and a separate reflection slot.
5. **Open instructor view** summarizes checks, hints, active commits, reversals, performed arrow bundles, and reflections from the active exercise.
6. **Download JSON** prepares a local file. **Copy JSON** provides a clipboard fallback for hosts that suppress Blob downloads.

Reflection text is limited to 1,200 characters. Removing a saved reflection requires confirmation and appends `reflection_removed`; the chemistry state is unchanged.

## Storage and migration

- Saved practice uses `mechanism-canvas:workspace:v4` in browser local storage.
- The loader accepts the previous v3 and v2 catalogs. Older v2 commit records are normalized with `reflection: null` and `reflectionUpdatedAt: null`; older catalogs restore with no pending agent proposal.
- The original v1 single-workspace migration remains supported.
- `?demo=1` still passes `null` storage to the same store, so demo records reset on refresh and never read or write saved practice.
- Reset clears the active exercise's reflections with its commit history after the existing explicit confirmation.

Reflection writes advance `activitySequence` but never `mechanismRevision`. Existing human and WebMCP draft/check/commit calls therefore keep their revision and stale-state contracts.

## Export schema

`src/domain/learning-record.ts` builds `mechanism-canvas.learning-record` schema version 1 from an explicit allowlist. The payload contains:

- export time, session mode, and active-exercise scope;
- public problem metadata and current committed status;
- attempt, hint, commit, reversal, and reflection metrics;
- the current committed graph only;
- the current visible draft and safe latest-check summary;
- performed commit bundles, including active or reversed status and learner reflection;
- the locally retained activity trail; and
- a machine-readable privacy boundary.

It intentionally omits:

- `ProblemDefinition.steps` as a serialized structure;
- authored `acceptedBundles` and negative cases;
- unreached state graphs;
- a pending agent proposal and its rationale;
- validation IDs, draft signatures, and commit authority;
- dedicated learner name, email, course, account, or other identity fields;
- other exercise workspaces and unrelated browser storage.

A committed record can include the arrow bundle the learner or agent actually performed. That is reached session evidence, not the authored answer definition. Before a commit, the export cannot reveal the next state ID or graph. The schema does not add identity fields, but a freeform reflection may contain any text the learner entered; the UI therefore asks users to review reflections before sharing.

## Source map

| Concern | Source |
|---|---|
| Commit/reflection types | `src/domain/types.ts` |
| Export allowlist and filename | `src/domain/learning-record.ts` |
| v2/v3 to v4 migration, proposal persistence, and reflection command | `src/store/mechanism-store.ts` |
| Reflection, instructor view, download, and copy UI | `src/components/LearningRecord.tsx` |
| Responsive and dialog styling | `src/index.css` |
| Privacy/answer-leak tests | `src/domain/learning-record.test.ts` |
| Persistence/revision/undo tests | `src/store/mechanism-store.test.ts` |

## Verification boundary

Automated tests prove schema shape, explicit secret-field exclusions, persistence migration, revision independence, and undo retention. Rendered browser QA must separately verify keyboard focus, dialog close and Escape behavior, responsive reflow, clipboard output, download behavior in supported target browsers, and console cleanliness. A host that suppresses Blob downloads can still use Copy JSON; do not claim a file download passed in that host unless a download is observed.
