# Mechanism Canvas palette direction decision handoff

Date: 2026-08-29

## Objective

Choose a memorable, coherent hackathon-facing color direction before changing the production color tokens again. The interface hierarchy, chemistry layout, typography, semantic color roles, and feature behavior are protected during this decision.

## Current decision state

- The user selected **02. Tidal Pop**.
- The selected palette is implemented in `src/index.css`, locked by `tests/color-system.test.ts`, and documented in `DESIGN.md`.
- Layout, chemistry geometry, component markup, controls, and behavior were intentionally left unchanged.
- The release scope is the coherent Reaction Line, Electron Flow Replay, comparison-layout, Tidal Pop, documentation, and regression-test batch described here.
- The user explicitly authorized commit, push, deployment, and this handoff update on 2026-08-29.
- Pushing `main` triggers `.github/workflows/deploy-pages.yml`, which runs the complete test/build gate before publishing `dist` to GitHub Pages.

## Decision artifact

The interactive palette comparison and raw browser screenshots were local QA artifacts and are intentionally excluded from the public repository. The durable selected contract lives in `DESIGN.md`, the production tokens live in `src/index.css`, and the exact regression coverage lives in `tests/color-system.test.ts`.

## Palette directions

### 01. Signal Blue — recommended starting point

Personality: crisp, confident, technical.

Signature: cobalt workspace plus tangerine replay.

| Role | Hex |
| --- | --- |
| Chrome | `#182B5C` |
| Action | `#1F5BD8` |
| Replay | `#C83A22` |
| Draft | `#F8D36A` |
| Reasoning | `#DDE8FF` |
| Evidence | `#EAE2FF` |
| Brief | `#FFE7D1` |
| Success | `#167A5A` |
| Canvas | `#E8ECF5` |
| Paper | `#FBFCFF` |
| Ink | `#16213B` |

Tradeoff: strongest balance of judge recall, chemistry clarity, and polish.

### 02. Tidal Pop — selected and implemented

Personality: fresh, optimistic, kinetic.

Signature: deep-ocean chrome plus clear aqua interactions.

| Role | Hex |
| --- | --- |
| Chrome | `#073B4C` |
| Action | `#007A78` |
| Replay | `#C9432D` |
| Draft | `#FFDB6E` |
| Reasoning | `#D5EEF3` |
| Evidence | `#D9E7FF` |
| Brief | `#DCEFF2` |
| Success | `#126F50` |
| Canvas | `#E7F0F1` |
| Paper | `#FCFEFD` |
| Ink | `#0B2B31` |

Tradeoff: friendliest direction; energetic without making the chemistry feel toy-like.

### 03. Berry Circuit

Personality: warm, authored, unexpected.

Signature: blackberry chrome plus raspberry interaction color.

| Role | Hex |
| --- | --- |
| Chrome | `#48213F` |
| Action | `#8A2F68` |
| Replay | `#C84252` |
| Draft | `#F3CE65` |
| Reasoning | `#E4E2FA` |
| Evidence | `#DDF2EA` |
| Brief | `#F7E2EB` |
| Success | `#287B64` |
| Canvas | `#F0E9F0` |
| Paper | `#FFF9FC` |
| Ink | `#321D36` |

Tradeoff: most ownable editorial identity, with a softer technical tone.

### 04. Night Shift

Personality: bold, fast, high-energy.

Signature: ink-black chrome plus indigo and electric citron.

| Role | Hex |
| --- | --- |
| Chrome | `#171A2B` |
| Action | `#4054D6` |
| Replay | `#C33A24` |
| Draft | `#D9F05A` |
| Reasoning | `#DDE5FF` |
| Evidence | `#DFF1EC` |
| Brief | `#E9E6FF` |
| Success | `#147A5B` |
| Canvas | `#E8E9F0` |
| Paper | `#FBFBFE` |
| Ink | `#171A2B` |

Tradeoff: highest demo-stage pop and highest risk of excess; requires strict restraint in production.

## Art-direction logic

- A judge should be able to remember one dominant signature pair rather than a collection of unrelated pastel panels.
- Full panel surfaces carry meaning: brief, draft, reasoning, evidence, before, and after.
- Strong colors are reserved for chrome, primary action, replay, success, and the draft state.
- The canvas and molecule remain optically quiet so electron flow stays dominant.
- The red vertical instruction accent remains removed; the instruction is a complete soft action panel.
- No gradients, decorative color smudges, glow effects, or unrelated accent strips are part of these directions.

## Verification completed

### Contrast

- Every ink-on-panel pairing is above 10:1 in all four directions.
- Muted text on paper is above 5.7:1 in all four directions.
- White on chrome, action, replay, and success is at least 4.8:1 after replay colors were darkened where needed.

### Render and responsive QA

- `1024px`: root `992px` wide, no horizontal overflow.
- `736px`: root `704px` wide, no horizontal overflow.
- `360px`: root `328px` wide, no horizontal overflow.
- The wide and narrow renders were visually inspected.
- Palette buttons were exercised programmatically for all four directions.
- Each selection correctly updated `aria-pressed`, the direction label, and product-specific CSS role tokens.
- The comparison keeps atom centers and the reaction plus on one baseline.
- Atom IDs use compact uppercase styling; hydrogen counts use italic secondary styling.
- The replay triangle is centered by an explicit SVG viewBox and symmetric path.

### Production implementation QA

- `npm test`: 16 files and 81 tests passed.
- `npm run build`: TypeScript and Vite production build passed.
- UI static checker: 55 files scanned, 0 errors, 0 warnings.
- Browser core journey: source selection, two-arrow draft, validation, commit, comparison opening, and phone reflow passed.
- Browser accessibility/runtime audit: zero unnamed interactive controls, runtime errors, or failed requests.
- Reaction Line matrix: capstone steps 1 and 2, SN2, proton transfer, replay, reduced motion, 390 px, 900 px, and 200% text zoom passed.
- Every measured comparison stage reported `0` heavy-atom baseline spread, `0` plus-sign baseline spread, and no map-label or implicit-hydrogen collisions.
- Final evidence is saved under `.qa/color-system-tidal-pop-*.png` and the refreshed `.qa/reaction-line-*.png` set.

## Authoritative design criteria used

- Apple Design Awards emphasize distinctive, cohesive themes, strong visual design, ease of use, attention to detail, and polish.
- WCAG 2.2 contrast thresholds were used as the accessibility floor: 4.5:1 for normal text and 3:1 for large text.

Sources:

- https://developer.apple.com/design/awards/
- https://developer.apple.com/videos/play/wwdc2019/104/
- https://www.w3.org/TR/WCAG22/

## Next step

1. Commit the exact coherent release scope on `main`.
2. Push once to `origin/main` and allow the verified Pages workflow to deploy that commit.
3. Confirm the GitHub Actions run succeeds, the public URL serves the new commit, assets load, and `?demo=1` remains usable.
4. Record the final commit, workflow, and public smoke-test evidence in the delivery report.
