# Mechanism Canvas design contract

## Product

- Direction: **Bench Notebook**.
- Thesis: help early organic chemistry learners externalize electron movement and receive precise, inspectable feedback without surrendering the reasoning step.
- Core journey: choose one of two reaction stations, inspect the authored reaction, select electron source and target twice, check the atomic bundle, then commit or revise.
- Audience: undergraduate learners working at a laptop, including keyboard and screen-reader users.
- Platform: responsive web app optimized for 1440 × 900, usable from 360 px upward.
- Persistence: local browser storage only; no account, server, or implied cloud sync.

## Visual voice

- Register: rigorous, tactile, calm. Avoid futuristic AI dashboards and childish classroom graphics.
- Subject concept: a contemporary chemistry lab notebook laid over an instrument bench.
- Dominant rule: a dense central reaction field framed by quieter written evidence.
- Counter-rule: status feedback breaks the graphite grid with chemically meaningful green, amber, rust, and cyan.
- Signature: the curved arrows stay physically anchored to stable atom, bond, and lone-pair entities while the right panel narrates the same action in words.
- Three-dimensional signature: a clean laboratory-style WebGL stage exposes tetrahedral depth, electron-domain lobes, bond-order rods, polarity direction, and formal-charge fields without replacing the exact 2D mechanism notation.
- Typography: the product name and structural headings use a compact modern sans; the serif is reserved for problem prose and chemical notation, while monospaced text is reserved for IDs, states, and measurements.
- Creative risk: making electron pairs directly clickable. Test target size, keyboard focus, and whether learners mistake them for decoration.

## System

- Geometry: square-edged sheets, 2 px keylines, restrained 8–12 px corners, alignment on a 4 px base unit.
- Material: warm paper, graphite ink, and faint cyan instrument marks; no glass or gradients.
- Typography: Georgia for scientific headings and reaction labels; system sans for controls; monospace for stable IDs and revisions.
- Palette: warm off-white canvas, near-black ink, quiet taupe borders, cyan focus, amber draft, deep green accepted, rust instructional mismatch, red invariant failure.
- Iconography: CSS/SVG line marks with visible labels; no decorative icon library.
- Motion: brief opacity and stroke transitions only; all removed under reduced-motion.

## Behavior and trust

- Navigation: one workspace at `/`; a native selector swaps the active problem inside the same authoritative store and preserves separate local progress.
- Primary action: **Check step**. It never mutates the committed mechanism.
- Commit: enabled only for a current valid check; undo is explicit and reversible.
- State grammar: every status includes text and shape, never color alone.
- Copy: concise chemistry verbs—select, check, commit, undo, inspect. No AI cheerleading.
- Trust: chemistry is fixture-bound and deterministic. Agent actions appear in the same visible trail. Storage and milestone limitations stay visible.

## Validation

- First attention: reaction and current instruction. Second: draft arrows. Third: feedback and trail.
- A first-time learner should understand that arrows start at electrons and that both electron movements in either represented family must be checked together.
- Core controls must work by keyboard with visible focus, meaningful names, and an equivalent textual entity inventory.
- The interface becomes generic if the anchored electron-pair controls, atomic validation bundle, and shared human/agent trail are removed.
