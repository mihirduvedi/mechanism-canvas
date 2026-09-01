import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const reactionGardenCss = readFileSync(join(process.cwd(), "src/soft-orbit.css"), "utf8");
const baseCss = readFileSync(join(process.cwd(), "src/index.css"), "utf8");
const molecularModelSource = readFileSync(
  join(process.cwd(), "src/components/MolecularModel.tsx"),
  "utf8",
);

const retiredShapeAssets = [
  ...["a", "b", "c", "d", "e", "f"].map((variant) => `cloud-shape-${variant}.svg`),
  ...["a", "b", "c", "d"].map((variant) => `cloud-compact-${variant}.svg`),
];

describe("Reaction Garden uniform controls", () => {
  it("uses one capsule rule for every eligible wide control", () => {
    const sharedShapeRule = reactionGardenCss.match(/\/\* Uniform Orbit:[\s\S]*?\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";

    expect(sharedShapeRule).toContain("border-radius: var(--control-radius, var(--radius-control)) !important;");
    expect(sharedShapeRule).toContain("border: var(--control-border-width, 1px) solid var(--control-edge, #71918c) !important;");
    expect(reactionGardenCss).toMatch(/--radius-control:\s*999px/);
  });

  it("uses exact circles for compact square counters and toggles", () => {
    expect(reactionGardenCss).toMatch(
      /\.agent-sandbox-preview__trust-flow li > span,[\s\S]*?\.learning-drawer__toggle\s*\)\s*\{\s*--control-radius:\s*50%;/s,
    );
    expect(reactionGardenCss).toMatch(/\.brand-mark\s*\{[^}]*border-radius:\s*50%;/s);
    expect(reactionGardenCss).toMatch(/\.agent-sandbox-preview__seal-mark\s*\{[^}]*border-radius:\s*50%;/s);
  });

  it("removes the retired irregular mask system completely", () => {
    expect(reactionGardenCss).not.toMatch(/cloud-mask|cloud-compact|cloud-outline/);
    expect(reactionGardenCss).not.toMatch(/(?:-webkit-)?mask-image/);
    expect(reactionGardenCss).not.toMatch(/clip-path/);
    retiredShapeAssets.forEach((asset) => {
      expect(existsSync(join(process.cwd(), "src/assets", asset))).toBe(false);
    });
  });

  it("keeps complete conventional borders and visible focus rings", () => {
    expect(reactionGardenCss).toMatch(
      /\.button--organic-clear\s*\{[^}]*--control-edge:\s*#a87820;[^}]*--control-border-width:\s*2px;/s,
    );
    expect(reactionGardenCss).toMatch(/:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--focus\);[^}]*outline-offset:\s*2px;/s);
    expect(reactionGardenCss).toMatch(/@media \(forced-colors: active\)[\s\S]*border:\s*2px solid ButtonText !important;/s);
  });

  it("retains semantic edge colors without changing silhouette", () => {
    expect(reactionGardenCss).toMatch(/\.button--primary\s*\{[^}]*--control-edge:\s*#00615f;/s);
    expect(reactionGardenCss).toMatch(/\.button--commit\s*\{[^}]*--control-edge:\s*#0b6044;/s);
    expect(reactionGardenCss).toMatch(/\.button--secondary\s*\{[^}]*--control-edge:\s*#91aaa6;/s);
    expect(reactionGardenCss).toMatch(/\.button--organic-lab\s*\{[^}]*--control-edge:\s*#5d396e;/s);
  });

  it("retains the exercise separator and hero-alignment repairs", () => {
    expect(reactionGardenCss).toMatch(/\.problem-rail__more-content\s*\{[^}]*border-block-start:\s*0/s);
    expect(reactionGardenCss).toMatch(/\.compact-stats--secondary\s*\{[^}]*border:\s*0/s);
    expect(reactionGardenCss).toMatch(/\.agent-sandbox-preview__canvas-link\s*\{[^}]*display:\s*inline-flex/s);
  });

  it("centers every WebMCP capability count on its connector axis", () => {
    expect(reactionGardenCss).toMatch(
      /\.agent-stage__content \.webmcp-flight-path strong\s*\{[^}]*align-self:\s*center;/s,
    );
  });

  it("uses centered CSS geometry for the dipole legend arrow", () => {
    expect(molecularModelSource).toContain(
      '<span className="force-key__polarity" aria-hidden="true" />Longer dipole arrow means larger ΔEN',
    );
    expect(molecularModelSource).not.toContain(">↦</span>");
    expect(baseCss).toMatch(
      /\.force-key__polarity\s*\{[^}]*position:\s*relative;[^}]*font-size:\s*0;[^}]*linear-gradient/s,
    );
    expect(baseCss).toMatch(/\.force-key__polarity::before\s*\{[^}]*inset-block-start:\s*9px/s);
    expect(baseCss).toMatch(/\.force-key__polarity::after\s*\{[^}]*inset-block-start:\s*6px/s);
  });
});
