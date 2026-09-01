import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const reactionGardenCss = readFileSync(join(process.cwd(), "src/soft-orbit.css"), "utf8");
const cloudVariants = ["a", "b", "c", "d", "e", "f"] as const;
const cloudSvgs = cloudVariants.map((variant) =>
  readFileSync(join(process.cwd(), `src/assets/cloud-shape-${variant}.svg`), "utf8"),
);
const compactClouds = ["a", "b", "c", "d"].map((variant) =>
  readFileSync(join(process.cwd(), `src/assets/cloud-compact-${variant}.svg`), "utf8"),
);

function tokenValue(name: string): string {
  const match = reactionGardenCss.match(new RegExp(`${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`Missing ${name} from the Reaction Garden tokens.`);
  return match[1].trim();
}

describe("Reaction Garden cloud controls", () => {
  it("uses six stable, unique, genuinely multi-lobed spline masks", () => {
    const paths = cloudSvgs.map((svg) => svg.match(/<path[^>]+d="([^"]+)"/)?.[1]);

    expect(new Set(paths).size).toBe(cloudVariants.length);
    cloudSvgs.forEach((svg) => {
      expect(svg).toContain('preserveAspectRatio="none"');
      expect(svg).not.toMatch(/<(?:ellipse|polygon|rect)\b/);
      expect(svg.match(/C/g)?.length).toBeGreaterThanOrEqual(12);
    });
    expect(reactionGardenCss).not.toMatch(/Math\.random|random\s*\(/);
  });

  it("uses separate hand-drawn clouds for square counters and toggles", () => {
    const paths = compactClouds.map((svg) => svg.match(/<path[^>]+d="([^"]+)"/)?.[1]);

    expect(new Set(paths).size).toBe(compactClouds.length);
    compactClouds.forEach((svg) => {
      expect(svg).toContain('viewBox="0 0 100 100"');
      expect(svg).not.toMatch(/<(?:ellipse|polygon|rect)\b/);
      expect(svg.match(/C/g)?.length).toBeGreaterThanOrEqual(8);
    });
    expect(reactionGardenCss).toMatch(/\.agent-sandbox-preview__trust-flow li > span\s*\{[^}]*var\(--cloud-compact-a\)/s);
    expect(reactionGardenCss).toMatch(/\.compact-stats--secondary > div\s*\{[^}]*var\(--cloud-compact-a\)/s);
    expect(reactionGardenCss).toMatch(/\.agent-stage__number,\s*\.agent-stage__toggle\s*\{[^}]*var\(--cloud-compact-d\)/s);
  });

  it("maps every pivotal action to a different cloud silhouette", () => {
    const masks = cloudVariants.map((variant) => tokenValue(`--cloud-mask-${variant}`));

    expect(new Set(masks).size).toBe(cloudVariants.length);
    expect(reactionGardenCss).toMatch(/\.button--organic-hero\s*\{[^}]*var\(--cloud-mask-a\)/s);
    expect(reactionGardenCss).toMatch(/\.button--organic-check\s*\{[^}]*var\(--cloud-mask-b\)/s);
    expect(reactionGardenCss).toMatch(/\.button--organic-commit\s*\{[^}]*var\(--cloud-mask-c\)/s);
    expect(reactionGardenCss).toMatch(/\.button--organic-undo\s*\{[^}]*var\(--cloud-mask-d\)/s);
    expect(reactionGardenCss).toMatch(/\.button--organic-clear\s*\{[^}]*var\(--cloud-mask-e\)/s);
    expect(reactionGardenCss).toMatch(/\.button--organic-lab\s*\{[^}]*var\(--cloud-mask-f\)/s);
  });

  it("extends the cloud family across supporting controls and cutouts", () => {
    expect(reactionGardenCss).toMatch(/\.tool-status\s*\{[^}]*var\(--cloud-mask-b\)/s);
    expect(reactionGardenCss).toMatch(/\.session-link\s*\{[^}]*var\(--cloud-mask-c\)/s);
    expect(reactionGardenCss).toMatch(/\.problem-picker select\s*\{[^}]*var\(--cloud-mask-c\)/s);
    expect(reactionGardenCss).toMatch(/\.problem-rail__more > summary\s*\{[^}]*var\(--cloud-mask-d\)/s);
    expect(reactionGardenCss).toMatch(/\.model-toggle\s*\{[^}]*var\(--cloud-mask-e\)/s);
    expect(reactionGardenCss).toMatch(/\.state-seal\s*\{[^}]*var\(--cloud-mask-f\)/s);
    expect(reactionGardenCss).toMatch(/\.demo-notice button\s*\{[^}]*var\(--cloud-mask-c\)/s);
    expect(reactionGardenCss).toMatch(/\.agent-stage__number,\s*\.agent-stage__toggle\s*\{/s);
  });

  it("keeps conventional hit areas, complete painted edges, and accessible fallbacks", () => {
    expect(reactionGardenCss).toContain("-webkit-mask-image: var(--cloud-mask);");
    expect(reactionGardenCss).toContain("mask-image: var(--cloud-mask);");
    expect(tokenValue("--cloud-outline")).toContain("drop-shadow(1px 0 0 var(--cloud-edge))");
    expect(reactionGardenCss).not.toMatch(/clip-path:/);
    expect(reactionGardenCss).toMatch(/\.button--organic-clear\s*\{[^}]*--cloud-edge:\s*#a87820/s);
    expect(reactionGardenCss).toMatch(/@media \(forced-colors: active\)[\s\S]*mask-image:\s*none/s);
  });

  it("retains the exercise separator and hero-alignment repairs", () => {
    expect(reactionGardenCss).toMatch(/\.problem-rail__more-content\s*\{[^}]*border-block-start:\s*0/s);
    expect(reactionGardenCss).toMatch(/\.compact-stats--secondary\s*\{[^}]*border:\s*0/s);
    expect(reactionGardenCss).toMatch(/\.agent-sandbox-preview__canvas-link\s*\{[^}]*display:\s*inline-flex/s);
  });
});
