import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const reactionGardenCss = readFileSync(join(process.cwd(), "src/soft-orbit.css"), "utf8");

const pivotalPebbleTokens = [
  "--pebble-hero",
  "--pebble-check",
  "--pebble-commit",
  "--pebble-undo",
  "--pebble-clear",
  "--pebble-lab",
] as const;

const supportingPebbleTokens = [
  "--pebble-action",
  "--pebble-manual",
  "--pebble-saved",
  "--pebble-model",
  "--pebble-seal",
  "--pebble-review",
  "--pebble-select",
  "--pebble-more",
  "--pebble-copy",
  "--pebble-metric-one",
  "--pebble-metric-two",
  "--pebble-metric-three",
  "--pebble-toggle-one",
  "--pebble-toggle-two",
  "--pebble-toggle-three",
  "--pebble-toggle-four",
] as const;

function tokenValue(name: string): string {
  const match = reactionGardenCss.match(new RegExp(`${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`Missing ${name} from the Reaction Garden tokens.`);
  return match[1].trim();
}

describe("Reaction Garden organic controls", () => {
  it("gives every pivotal action a stable, unique, and softly bounded silhouette", () => {
    const shapes = pivotalPebbleTokens.map(tokenValue);

    expect(new Set(shapes).size).toBe(pivotalPebbleTokens.length);
    shapes.forEach((shape) => {
      expect(shape).toMatch(/^(?:\d+px\s+){3}\d+px\s*\/\s*(?:\d+px\s+){3}\d+px$/);
    });
    expect(reactionGardenCss).not.toMatch(/Math\.random|random\s*\(/);
  });

  it("extends the stable pebble family across supporting controls and cutouts", () => {
    const shapes = supportingPebbleTokens.map(tokenValue);

    expect(new Set(shapes).size).toBe(supportingPebbleTokens.length);
    expect(reactionGardenCss).toMatch(/\.tool-status\s*\{[^}]*var\(--pebble-manual\)/s);
    expect(reactionGardenCss).toMatch(/\.session-link\s*\{[^}]*var\(--pebble-saved\)/s);
    expect(reactionGardenCss).toMatch(/\.model-toggle\s*\{[^}]*var\(--pebble-model\)/s);
    expect(reactionGardenCss).toMatch(/\.state-seal\s*\{[^}]*var\(--pebble-seal\)/s);
    expect(reactionGardenCss).toMatch(/\.review-stamp\s*\{[^}]*var\(--pebble-review\)/s);
    expect(reactionGardenCss).toMatch(/\.problem-picker select\s*\{[^}]*var\(--pebble-select\)/s);
    expect(reactionGardenCss).toMatch(/\.demo-notice button\s*\{[^}]*var\(--pebble-copy\)/s);
  });

  it("keeps the organic contour on the outside without clipping button content", () => {
    expect(reactionGardenCss).toContain("border-radius: var(--organic-shape, var(--radius-control));");
    expect(reactionGardenCss).not.toMatch(/\.button--organic\s*\{[^}]*clip-path:/s);
    expect(reactionGardenCss).not.toMatch(/\.button--organic\s*\{[^}]*overflow:\s*hidden/s);
  });

  it("owns the exercise separator once and gives Clear draft a complete outline", () => {
    expect(reactionGardenCss).toMatch(/\.problem-rail__more-content\s*\{[^}]*border-block-start:\s*0/s);
    expect(reactionGardenCss).toMatch(/\.compact-stats--secondary\s*\{[^}]*border:\s*0/s);
    expect(reactionGardenCss).toMatch(/\.button--organic-clear\s*\{[^}]*border:\s*2px solid #a87820/s);
    expect(reactionGardenCss).toMatch(/\.button--organic-clear:disabled\s*\{[^}]*border-color:\s*#a87820/s);
    expect(reactionGardenCss).toMatch(/\.agent-sandbox-preview__canvas-link\s*\{[^}]*display:\s*inline-flex/s);
  });
});
