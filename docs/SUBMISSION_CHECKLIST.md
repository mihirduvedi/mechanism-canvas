# WebMCP Challenge submission checklist

Last audited: August 31, 2026 (PDT). The [Official Rules](https://webmcp.devpost.com/rules) are authoritative; the [challenge overview](https://webmcp.devpost.com/) and [Devpost submission guide](https://help.devpost.com/article/126-know-your-submission-steps) provide supporting form guidance.

This checklist separates facts proved by the repository from actions that require Mihir's account, legal confirmation, publication approval, or a compatible WebMCP host. A passing build is not evidence that those external steps happened.

## Deadline and judging window

- Submission closes **September 3, 2026 at 1:00 PM PDT**.
- Judging begins **September 4, 2026 at 10:00 AM PDT** and ends **September 21, 2026 at 5:00 PM PDT**.
- Winners are expected to be announced around **September 23, 2026**.
- Keep the repository, live demo, and public video free and unrestricted through the end of judging.

## Official requirement matrix

| Requirement | Status on August 31 | Evidence or exact remaining action |
|---|---|---|
| WebMCP-powered web app about people and agents collaborating on the open web | Ready | The app exposes an adaptive catalog of 26 Site Tools over the learner's semantic canvas and explicit authority contract. See [HACKATHON.md](../HACKATHON.md). |
| Live URL judges can access without restriction | Released; refresh pending | The current release is public at <https://mihirduvedi.github.io/mechanism-canvas/?demo=1>. Push and deploy this submission-package revision after approval. |
| Runs in ChatGPT's in-app browser or WebMCP-enabled Chrome | App support implemented; host attestation pending | Chrome and the available Codex in-app browser rendered the app correctly but did not expose `document.modelContext`. Run the [judge guide](JUDGE_GUIDE.md) in a compatible host and capture **Host attested**, **16 → 21 → 15 → 4**, and **7 / 7**. |
| English text explains why the use case fits WebMCP | Ready | [DEVPOST_SUBMISSION.md](DEVPOST_SUBMISSION.md), “Why WebMCP fits.” |
| English text explains the UX improvement | Ready | [DEVPOST_SUBMISSION.md](DEVPOST_SUBMISSION.md), “How the experience is better.” |
| English text explains what people and agents can now do together | Ready | [DEVPOST_SUBMISSION.md](DEVPOST_SUBMISSION.md), “What people and agents can do together.” |
| English text briefly explains the WebMCP implementation | Ready | [DEVPOST_SUBMISSION.md](DEVPOST_SUBMISSION.md), “How WebMCP is implemented.” |
| Public repository contains source, assets, and functional instructions | Ready locally; push pending | Source, locked dependencies, judge instructions, submission copy, artwork, and verification are present. Approve an exact-path commit and push. |
| Detectable open-source license is visible | Ready | Root [MIT license](../LICENSE), `package.json` license metadata, and [third-party notices](../THIRD_PARTY_NOTICES.md). |
| Repository demonstrates `document.modelContext.registerTool` | Ready | [`src/webmcp/register-tools.ts`](../src/webmcp/register-tools.ts) registers adaptive closed-schema tools. |
| Project is new or prior work is disclosed | Ready | New repository created August 28, 2026; all twelve released commits were authored during the submission period. See [HACKATHON.md](../HACKATHON.md#build-period-provenance). |
| Public YouTube video demonstrates the functioning project with audio | Parallel video workstream | Add its final public URL to [DEVPOST_SUBMISSION.md](DEVPOST_SUBMISSION.md) and Devpost. |
| Video is under three minutes | Parallel video workstream | Verify the exact exported duration before upload. |
| Video and entry use only authorized material | Repository side ready; final video review pending | Repository artwork and copy are original. Dependencies and licenses are recorded in [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md). Review the final video separately for music, marks, and third-party material. |
| Submission is in English | Ready except final video review | App, repository, and copy package are English. |
| Entrant owns the work and has rights to submit it | Owner confirmation required | Mihir must make the final ownership and rights representation; the repository audit found no bundled third-party photos, music, datasets, or credentials. |
| Entrant is eligible and registration/team details are correct | Owner action required | Join the challenge and accept its eligibility and legal terms personally. Do not infer these facts from the repository. |
| Entry is submitted before the deadline | Not yet submitted | Review the exact final entry, obtain publication approval, submit, and preserve the Devpost confirmation. |

## Devpost package

| Field | Prepared value |
|---|---|
| Name | Mechanism Canvas |
| Tagline | An organic chemistry canvas where WebMCP agents test competing mechanisms, show their evidence, and leave the final move to the learner. |
| Thumbnail | [`public/mechanism-canvas-social-card.png`](../public/mechanism-canvas-social-card.png), 1800 × 1200 PNG, 3:2, under 5 MB |
| Story | [Copy-ready project story](DEVPOST_SUBMISSION.md) |
| Built with | WebMCP, React, TypeScript, Vite, Three.js, Vitest, GitHub Pages, HTML, CSS, SVG |
| Try it out | <https://mihirduvedi.github.io/mechanism-canvas/?demo=1> |
| Source | <https://github.com/mihirduvedi/mechanism-canvas> |
| Video | Waiting for the parallel video workstream's final public YouTube URL |

The standard Devpost form also allows an optional image gallery. The project thumbnail and the live product are sufficient for compliance; add gallery images only if they strengthen the final story and match the deployed revision.

## Registration fields that require Mihir

The signed-in Devpost account has not joined the challenge. The current registration page asks for:

- teammate status: working solo, looking for teammates, or already have a team;
- how Mihir heard about the challenge;
- work role: founder, startup developer, mid-large-company developer, independent developer/freelancer, student, non-technical builder/creator, or other;
- Codex usage frequency;
- prior WebMCP familiarity;
- prior ChatGPT in-app-browser usage;
- optional OpenAI marketing consent;
- confirmation of legal age and permitted country/territory;
- agreement to the Official Rules and Devpost Terms of Service.

Mihir should supply or select these answers and personally accept the legal terms. Registration must happen before a draft can be created or the challenge-specific submission fields can be inspected.

## Final publication sequence

1. Run `npm ci && npm run verify:submission` from a clean checkout.
2. Review the exact repository diff, then approve an exact-path commit and push.
3. Confirm GitHub Pages deploys that exact commit, then run `npm run verify:release` to prove tracking, clean state, local/remote commit parity, live metadata, and exact asset hashes.
4. Run the [judge guide](JUDGE_GUIDE.md) in a compatible WebMCP host. Save host-attested evidence; do not substitute Manual mode or a page-local adapter.
5. Join the challenge and confirm the owner-only registration and eligibility fields.
6. Add the final public YouTube URL and verify its duration, audio, visibility, rights, and match to the deployed release.
7. Create the Devpost draft and paste the prepared package. Recheck every visible field, link, image, and custom question.
8. Review the exact public entry and obtain explicit approval immediately before submission.
9. Submit before September 3 at 1:00 PM PDT and preserve the confirmation page or email.
10. Recheck the public demo, repository, and video after submission and keep them accessible through September 21 at 5:00 PM PDT.

## Verification boundaries

- Automated: 132 tests across 23 files, TypeScript, production build, metadata/package checks, repository hygiene, thumbnail dimensions, tagline length, plus a post-deploy tracked-state/SHA/live-asset gate.
- Rendered: local production build checked at 1440 × 900, 1024 × 768, 390 × 844, and 360 × 800 with no horizontal overflow; the two-arrow check/commit/replay path and viewport-bounded evidence dialog were exercised.
- Public release: the previously released commit is online and healthy; this submission package is not live until a new approved deployment.
- Live WebMCP: still pending because the available hosts did not expose `document.modelContext` on August 31.
- Devpost: account is signed in but not registered for this challenge; no draft or submission has been created.
