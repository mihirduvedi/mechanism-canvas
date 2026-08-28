# WebMCP Challenge: Research, Winning Strategy, and Project Ideas

Research date: August 27, 2026
Official deadline: September 3, 2026 at 1:00 p.m. Pacific Time

## Executive recommendation

The strongest project is not a general-purpose AI assistant. It is a focused web product in which:

1. a person manipulates a visual or structured workspace;
2. an agent operates the same live state through precise WebMCP tools;
3. each contributes something the other cannot provide alone; and
4. the result is visibly better than either a conventional UI or a chatbot by itself.

My best new-build recommendation is **Mechanism Canvas**, an interactive organic-chemistry reaction-mechanism workbench where the learner edits a molecular diagram and the agent can inspect atoms and bonds, propose a single electron movement, test it against deterministic chemistry rules, and adapt to the learner's decisions. It is visually memorable, has an unusually strong “why WebMCP?” argument, is scoped enough for the remaining time, and spans all four judging criteria.

My best privacy-and-trust concept is **Consent Lens**, a data-sharing workbench where a person and agent assemble the minimum necessary information for a fictional application or request while the interface makes every disclosure explicit.

My best practical concept is **Repair Relay**, a human-agent diagnostic bench for a bicycle or small appliance. The agent manages a fault tree while the human performs real-world observations that the browser cannot make.

If speed is more important than maximum novelty, an existing app can be extended. The rules allow this only when the WebMCP work is added after the submission period began and the new work is clearly distinguished with dated evidence. An **Agent Receipt Review Room** extension is a plausible reuse route, but only the new WebMCP layer would be judged.

## What the challenge is about

[OpenAI describes WebMCP](https://openai.com/webmcp-challenge/) as an experimental open standard that lets a website expose structured tools directly to an agent. Instead of forcing the agent to infer the purpose of buttons, fields, canvas objects, and menus, the site declares actions with names, descriptions, and JSON input schemas.

This is different from a normal MCP server. A remote or local MCP server can work independently of an open page. WebMCP tools belong to the page the user and agent are viewing, use that page's live state and session, and update the same interface. [Official OpenAI documentation](https://learn.chatgpt.com/docs/webmcp) says this is especially useful when a human and an agent need to see and change the same canvas, editor, or dashboard.

The challenge is therefore about the **agent-native web**, not merely “building an AI app.” The central question is:

> What becomes possible when a website deliberately gives both the person and the agent first-class ways to understand and change the same live experience?

The official prompt asks for a WebMCP-powered web app that explores a future where humans and agents “interact, collaborate, and create together.” A new app is encouraged, but an existing app may be meaningfully extended with WebMCP after August 25, with dated documentation of the new work. See the [Devpost overview](https://webmcp.devpost.com/) and [official rules](https://webmcp.devpost.com/rules).

## Official facts that affect project choice

- Submission deadline: **September 3, 2026 at 1:00 p.m. PT**.
- The project must be a working, hosted web app that judges can access in ChatGPT's in-app browser or Chrome with WebMCP enabled.
- The repository must be public, include all necessary source and instructions, and contain a visible open-source license.
- The submission needs a written explanation of the WebMCP fit, the human-agent experience, what was previously difficult or impossible, and the implementation.
- The official rules require a **public YouTube demo with audio shorter than three minutes**. One FAQ sentence says “there's no video,” but that conflicts with the overview, submission checklist, and official rules. Treat the rules as authoritative and submit the video.
- Existing apps qualify only if meaningfully extended with WebMCP during the submission period; only the new work is evaluated.
- Multiple submissions are allowed, but they must be substantially different.
- There is no team-size cap, although some physical/account prizes cover no more than three members.
- The top ten projects win. The package includes $3,000 cash from OpenAI plus partner prizes and credits.

Sources: [official rules](https://webmcp.devpost.com/rules), [Devpost requirements and judging](https://webmcp.devpost.com/), and [challenge resources](https://webmcp.devpost.com/resources).

## What kinds of projects belong in this challenge

The challenge is broad by subject but narrow by interaction model. Good project families include:

1. **Visual co-editors** — diagrams, maps, timelines, spatial layouts, scoreboards, evidence graphs, or molecular canvases that are hard for an agent to manipulate reliably through clicks.
2. **Complex configurators** — a person supplies preferences and judgment while the agent applies structured constraints and alternatives.
3. **Decision simulators** — the agent explores options and the human locks values, exceptions, or ethical choices.
4. **Evidence and annotation workbenches** — the agent proposes structure while the person approves interpretations and provenance.
5. **Stateful learning environments** — tools change as the learner progresses; the agent acts on the exact state rather than guessing from screenshots.
6. **Accessible task surfaces** — WebMCP exposes the semantics of complicated controls that are otherwise difficult for an agent or assistive workflow to operate.
7. **Meaningful extensions to existing products** — as long as the new WebMCP work is substantial and documented.

The official inspiration set already covers collaborative writing, travel planning, crosswords, meal planning, photo editing, grocery shopping, 3D modeling, music sequencing, games, and storefronts. The resources also foreground appointment booking, customer support, forms, restaurant ordering, travel, and ecommerce. Public Devpost search already finds voice-first browsers and general browser assistants using WebMCP. Those directions are not prohibited, but a generic version will face an originality problem.

I would avoid:

- another shopping cart, storefront, travel planner, meal planner, note editor, generic photo editor, or generic dashboard;
- a task manager with `create`, `update`, and `delete` tools;
- a chatbot embedded beside an ordinary app;
- an autonomous background agent whose work is disconnected from the visible page;
- a collection of trivial tools added only to satisfy the API requirement;
- a polished concept whose live WebMCP path is unreliable or impossible for judges to test.

The [official showcase](https://developers.openai.com/showcase?view=webmcp-apps) is the best current list of OpenAI's examples. The challenge's own [project gallery](https://webmcp.devpost.com/project-gallery) had not yet been published at research time, so no one can honestly guarantee that an idea is globally unique.

## What judges are looking for

The first round is pass/fail: does the project fit the theme, and does it actually use the required technology? Projects that pass are scored equally across four criteria:

| Criterion | What the rubric says | What a winning submission should demonstrate |
|---|---|---|
| WebMCP Leverage | Thorough, skillful, non-trivial WebMCP implementation | Several purposeful tools, precise schemas, shared state, meaningful read/write behavior, good error handling, and a workflow that would be unreliable through UI guessing |
| Execution | A complete, coherent product, not just a proof of concept | A polished human UI, a reliable agent path, seeded demo data, empty/error states, and a live URL that works immediately |
| Potential Impact | A credible solution for a real audience and problem | One named user, one painful moment, and a demo that proves the solution actually changes that outcome |
| Creativity & Ambition | A novel concept that differs from existing ideas | An unexpected subject or interaction, plus technical choices that serve the concept rather than decorate it |

All four criteria are equally weighted, but **WebMCP Leverage is the first tie-breaker**. That makes it the strategic priority. Source: [Devpost judging criteria](https://webmcp.devpost.com/rules).

OpenAI's challenge page summarizes a similar set of signals: usefulness, originality, execution, thoughtful WebMCP use, and quality of the human-agent experience. See the [OpenAI challenge FAQ](https://openai.com/webmcp-challenge/).

## The winning design pattern

A strong submission should have the following architecture and product behavior:

### 1. One shared source of truth

The human UI and every WebMCP tool should call the same domain commands. If a person moves an item, the agent sees the new state. If the agent changes something, the interface updates visibly and can be inspected or undone.

### 2. A deliberate tool surface

Aim for roughly 6–10 tools, not dozens:

- two or three read tools that expose compact, decision-relevant state;
- three to five write tools that perform high-level domain actions;
- one comparison, simulation, validation, or “explain this state” tool;
- one explicit review or commit step for a consequential action.

High-level domain actions are stronger than UI-shaped tools. `apply_electron_move` is better than `click_atom`; `compare_budget_scenarios` is better than `move_slider`.

### 3. Visible collaboration

The person should retain a meaningful role: perception, taste, value judgment, consent, exception handling, or final approval. The agent should contribute structured reasoning, exhaustive comparison, reconfiguration, or consistency checking. The demo should show at least two handoffs between them.

### 4. Thoughtful safety

Use narrow schemas, validate every input, describe side effects, mark read-only tools, label untrusted external/user content, and require review before consequential writes. Chrome's [WebMCP security guidance](https://developer.chrome.com/docs/ai/webmcp/secure-tools) recommends `readOnlyHint`, `untrustedContentHint`, trusted-origin restrictions, and concise outputs.

### 5. Evals, not only unit tests

Test both the code and the agent-tool boundary. Chrome's [WebMCP eval guidance](https://developer.chrome.com/docs/ai/webmcp/evals) recommends checking that an agent selects the correct tool, supplies correct arguments, follows the correct sequence, receives minimal useful output, and completes the intended journey. Include a small table of prompt → expected tool calls in the repository.

### 6. Build for the judge's environment

Use imperative `document.modelContext.registerTool(...)` registrations in the top-level page. [Current OpenAI documentation](https://learn.chatgpt.com/docs/webmcp) says ChatGPT's built-in browser does not yet discover declarative HTML-form tools or tools registered inside iframes. Preserve a complete human interface for ordinary browsers.

## Ranked project portfolio

The ratings below are directional judgments, not predictions. “Build risk” assumes a focused solo build before the September 3 deadline.

| Rank | Idea and subject | Why it could stand out | WebMCP-native interaction | Build risk |
|---:|---|---|---|---|
| 1 | **Mechanism Canvas — chemistry education** | Precise molecular semantics are difficult for click-based agents; the visual result is immediately legible | Inspect atoms/bonds, propose one electron move, apply or revert it, validate charge/valence, generate a targeted challenge | Medium |
| 2 | **Consent Lens — privacy and applications** | Turns data minimization and consent into a visible human-agent negotiation | Classify fields, set disclosure boundaries, simulate a recipient's view, request approval, export a redacted package | Medium |
| 3 | **Repair Relay — maintenance and right-to-repair** | The agent can reason over a fault tree while the human supplies physical observations | Focus a component, request a safe test, record an observation, eliminate causes, compare repair plans | Medium |
| 4 | **Continuity Desk — film production** | A distinctive visual timeline for a real, underserved workflow | Add shots, set prop/wardrobe facts, detect conflicts, approve creative exceptions, generate a day-of checklist | Low–medium |
| 5 | **Evidence Loom — scientific research** | Makes uncertainty and conflicting evidence tangible instead of producing a prose summary | Add claims, attach passages, link support/contradiction, mark uncertainty, compare hypotheses | Medium |
| 6 | **Civic Bargain Table — public policy** | A transparent alternative to opaque “AI policy” output | Lock non-negotiables, allocate funds, simulate a scenario, surface affected groups, compare compromises | Medium |
| 7 | **Access Path Lab — accessibility engineering** | Evaluates an actual multi-step interaction rather than generating a generic audit | Inspect landmarks, run a keyboard path, record a blocker, propose a patch, replay the journey | Medium |
| 8 | **Outage Commons — climate and energy** | Combines infrastructure constraints with human decisions about essential services | Set critical loads, inject an outage, allocate capacity, compare plans, annotate fairness trade-offs | Medium–high |
| 9 | **Dialect Forge — Spanish sociolinguistics** | Avoids the generic tutor pattern by focusing on register, region, and pragmatic choice | Highlight a phrase, classify register, add a regional contrast, record a misconception, generate a contrastive drill | Low–medium |
| 10 | **Rehearsal Grid — dance and choreography** | A memorable spatial co-creation demo outside typical AI categories | Place performers, assign counts, mirror a phrase, detect collisions, lock choreographer intent | Medium |
| 11 | **Provenance Room — museums and cultural heritage** | Evidence-first provenance work with explicit uncertainty and curator control | Add an object/source, assert a custody step, flag a gap, compare narratives, approve label language | Medium |
| 12 | **Mutual Aid Map — community resilience** | A consent-aware matching surface, not a generic emergency chatbot | Add a need/resource, propose a match, hide sensitive fields, approve contact, record fulfillment | Medium–high |
| 13 | **Fieldnote QA — ecology** | Human perception and agent consistency checks naturally complement one another | Record traits, map observations, flag contradictions, propose identification candidates, export a clean field record | Medium |
| 14 | **Agent Receipt Review Room — AI accountability** | Fastest reuse route; structured review and evidence navigation fit a live page well | Summarize receipt state, focus a finding, inspect evidence, set reviewer disposition, compare runs, export reviewed receipt | Low–medium, but existing-work documentation is mandatory |

## The four strongest ideas in detail

### 1. Mechanism Canvas — best overall recommendation

**Pitch:** A student and agent solve a reaction mechanism together on an SVG molecular canvas. The agent never draws uncontrolled prose arrows. It reads the exact molecular graph, proposes one structured electron move, and lets deterministic rules validate the result. The learner can reject the suggestion, choose an alternative atom or bond, request a hint, or ask why a move violates valence or charge constraints.

**Why WebMCP is essential:** A conventional browser agent must infer atom identity from coordinates and manipulate a canvas through brittle clicks. WebMCP can expose stable atom IDs, bond types, formal charges, and reaction-stage state. The agent acts semantically while the learner still sees and edits the mechanism visually.

**Core tools:** `get_mechanism_state`, `list_valid_targets`, `propose_electron_move`, `apply_electron_move`, `revert_last_move`, `validate_intermediate`, `request_learner_choice`, and `generate_next_challenge`.

**Six-day MVP:** Three seeded reaction families, an SVG editor with click-to-select atoms/bonds, a deterministic rule checker for allowed moves and charge conservation, an undo stack, and a short misconception log. Do not build a universal chemistry engine.

**Three-minute demo:** Open a seeded SN2 problem; ask the agent to diagnose the current state; agent proposes a move; learner rejects the first target; agent uses the updated selection; the canvas redraws; validator catches an invalid valence; learner corrects it; agent summarizes the exact misconception. End by showing the WebMCP tool list and one eval.

**Main risk:** Chemistry correctness. Keep the domain deliberately narrow and label the app an educational prototype, not a laboratory or safety tool.

### 2. Consent Lens — best trust and safety concept

**Pitch:** A person is preparing a fictional scholarship, rental, or volunteer application. The app displays a “data room” of possible facts and documents. The agent helps assemble a package, but the person sets audience-specific boundaries and approves every sensitive disclosure. A live recipient preview shows exactly what will be shared.

**Why WebMCP is essential:** This is not a form filler. It is a negotiation over live structured state, with different views for the owner and recipient. The agent can reason over requirements while the website owns validation, redaction, and consent.

**Core tools:** `list_requested_fields`, `classify_field_sensitivity`, `set_disclosure_rule`, `build_minimum_package`, `preview_recipient_view`, `explain_omission`, `request_disclosure_approval`, and `export_approved_package`.

**Six-day MVP:** Use synthetic data only; support one application scenario; implement field-level redaction, a side-by-side preview, an approval ledger, and JSON/PDF-like export preview. No real third-party submission.

**Main risk:** A privacy app that mishandles real data would undermine its own story. Keep the demo fictional and local-first, and make the safety model visible.

### 3. Repair Relay — best real-world collaboration concept

**Pitch:** A repair bench for one bounded system, such as a bicycle derailleur or drip coffee maker. The agent manages the diagnostic graph; the person performs visual, tactile, or sound-based checks in the physical world and records the result. Together they narrow the cause and produce a safe repair or escalation plan.

**Why WebMCP is essential:** The agent can maintain the structured reasoning state, while only the person can make physical observations. The page becomes the shared truth: diagram, eliminated causes, evidence, and next safe test.

**Core tools:** `get_fault_tree`, `focus_component`, `request_observation`, `record_observation`, `eliminate_cause`, `compare_repair_paths`, `mark_safety_stop`, and `generate_parts_checklist`.

**Six-day MVP:** One system, six to eight failure modes, a clickable exploded diagram, deterministic fault-tree updates, and two seeded diagnosis scenarios. Never advise electrical or hazardous repairs.

**Main risk:** It can look like a scripted decision tree. The agent must be able to navigate multiple valid diagnostic paths and explain why each observation changes the hypothesis set.

### 4. Continuity Desk — best low-risk creative concept

**Pitch:** A visual shot timeline and scene board for a short film. The script supervisor and agent track props, wardrobe, hand positions, weather, time of day, and line changes. The agent flags inconsistencies, but the human can mark intentional discontinuities as creative exceptions.

**Why WebMCP is essential:** The underlying state is a graph across shots, characters, props, and takes. WebMCP gives the agent stable concepts and relationships while the crew keeps a fast visual interface.

**Core tools:** `get_scene_state`, `add_shot`, `set_continuity_fact`, `compare_shots`, `flag_continuity_conflict`, `approve_creative_exception`, and `generate_shooting_checklist`.

**Six-day MVP:** One three-scene sample script, ten shots, a timeline, a prop/wardrobe matrix, seeded conflicts, and a printable checklist view.

**Main risk:** Impact is narrower than the top three. Win on polish, originality, and a flawless demo.

## A pragmatic reuse option: Agent Receipt Review Room

If the goal is to submit something reliable quickly, a meaningful WebMCP extension to an existing AI-agent audit app could work:

- read tools expose receipt summary, authority boundaries, coverage, findings, and currently selected evidence;
- write tools focus a finding, change the reviewer disposition, compare two fixture runs, and export a reviewed receipt;
- the agent helps investigate, but deterministic app logic remains authoritative;
- the human confirms the final review state.

This aligns with the challenge because the agent and reviewer inspect the same evidence-linked interface. Its weakness is novelty: the base product already exists, and judges will evaluate only post-August-25 WebMCP work. Use a clean commit boundary, a `HACKATHON_WORK.md` document, and a demo centered on the new collaboration rather than the existing product.

## Suggested build stack

For any of the new ideas, optimize for a reliable live demo:

- React + TypeScript + Vite or Next.js;
- a small domain model with pure reducer/command functions;
- the same command layer called by UI controls and WebMCP handlers;
- top-level imperative WebMCP registrations;
- localStorage or a tiny hosted database only if persistence materially improves the demo;
- seeded sample data and a one-click “load demo” action;
- no in-app LLM API unless it is indispensable—the external browser agent already supplies intelligence;
- Vitest for domain and tool tests;
- a small eval corpus containing at least 10 prompts with expected calls or call sequences;
- deployment on a provider whose headers and live URL can be tested early.

## Six-day execution plan

### Day 1 — lock the slice

- Register on Devpost.
- Choose one user, one scenario, and one 90-second golden path.
- Define the domain state and 6–8 WebMCP tools before designing screens.
- Create the public repository and open-source license.

### Day 2 — build the human product

- Implement the main visual workspace and seeded scenario.
- Put all state changes behind reusable command functions.
- Add undo, reset, and empty/error states.

### Day 3 — add WebMCP

- Register top-level imperative tools.
- Reuse the existing command layer.
- Add narrow schemas, annotations, validation, compact results, and clear side-effect descriptions.
- Test every tool manually in the judge's browser environment.

### Day 4 — complete the collaboration loop

- Add the moment where the agent needs human judgment.
- Add the moment where the human benefits from the agent's structured work.
- Implement confirmation for consequential changes and make the action history visible.

### Day 5 — harden

- Run deterministic tests and agent-call evals.
- Test fresh-session loading, narrow/mobile layouts, keyboard access, errors, and slow connections.
- Deploy and verify in ChatGPT's in-app browser and Chrome with WebMCP enabled.

### Day 6 — package and submit early

- Finish the README, architecture diagram, tool table, eval results, license visibility, and exact testing instructions.
- Record a public YouTube demo under three minutes with audio.
- Make the first 20 seconds show the problem, user, and surprising WebMCP action.
- Submit with buffer before September 3 at 1:00 p.m. PT.

## Demo structure that matches the rubric

1. **0:00–0:20 — problem and audience:** one sentence and one visual.
2. **0:20–0:45 — human starts:** show the normal interface and current state.
3. **0:45–1:35 — agent acts through WebMCP:** show two or three tool calls that change the visible product.
4. **1:35–2:05 — collaboration:** the human rejects, constrains, or approves something; the agent adapts.
5. **2:05–2:30 — complete outcome:** show the artifact, plan, diagnosis, or decision.
6. **2:30–2:50 — implementation proof:** tool list, schema or source excerpt, and one eval result.
7. **2:50–2:58 — impact statement:** say what was difficult before and why this interaction is credible.

## Final decision

Choose **Mechanism Canvas** if you want the best balance of originality, visual demo quality, and deep WebMCP leverage.

Choose **Consent Lens** if you want a technically thoughtful trust-and-safety story likely to appeal to browser/platform judges.

Choose **Repair Relay** if you want the clearest human-plus-agent division of labor and a practical social-impact narrative.

Choose **Continuity Desk** if you want the safest build with the highest chance of feeling complete and polished.

Choose **Agent Receipt Review Room** only if shipping speed and existing implementation quality outweigh the originality penalty, and document the new work meticulously.

## Primary sources

- [OpenAI WebMCP Challenge page](https://openai.com/webmcp-challenge/)
- [Devpost overview, requirements, prizes, and judging criteria](https://webmcp.devpost.com/)
- [Official challenge rules](https://webmcp.devpost.com/rules)
- [Challenge resources and FAQs](https://webmcp.devpost.com/resources)
- [Official OpenAI Site tools documentation](https://learn.chatgpt.com/docs/webmcp)
- [WebMCP specification](https://webmachinelearning.github.io/webmcp/)
- [Chrome WebMCP developer guide](https://developer.chrome.com/docs/ai/webmcp)
- [Chrome WebMCP security guidance](https://developer.chrome.com/docs/ai/webmcp/secure-tools)
- [Chrome WebMCP eval guidance](https://developer.chrome.com/docs/ai/webmcp/evals)
- [OpenAI WebMCP showcase](https://developers.openai.com/showcase?view=webmcp-apps)
