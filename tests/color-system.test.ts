import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const designCss = readFileSync(join(process.cwd(), "src/index.css"), "utf8");

function rootToken(name: string): string {
  const root = designCss.slice(designCss.indexOf(":root {"), designCss.indexOf("}\n\n*"));
  const match = root.match(new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, "i"));
  if (!match) throw new Error(`Missing ${name} in the root design tokens.`);
  return match[1];
}

function selectorBlock(selector: string): string {
  const start = designCss.lastIndexOf(`${selector} {`);
  if (start < 0) throw new Error(`Missing ${selector} in the final color system.`);
  const end = designCss.indexOf("\n}", start);
  return designCss.slice(start, end + 2);
}

function selectorBlockContaining(selector: string, declaration: string): string {
  let searchEnd = designCss.length;
  while (searchEnd > 0) {
    const start = designCss.lastIndexOf(`${selector} {`, searchEnd);
    if (start < 0) break;
    const end = designCss.indexOf("\n}", start);
    const block = designCss.slice(start, end + 2);
    if (block.includes(declaration)) return block;
    searchEnd = start - 1;
  }
  throw new Error(`Missing ${selector} with ${declaration} in the final color system.`);
}

function relativeLuminance(hex: string): number {
  const [red, green, blue] = hex
    .match(/[0-9a-f]{2}/gi)!
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

function contrast(first: string, second: string): number {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  return (
    (Math.max(firstLuminance, secondLuminance) + 0.05) /
    (Math.min(firstLuminance, secondLuminance) + 0.05)
  );
}

describe("Tidal Pop color system", () => {
  it("keeps core reading and filled-control pairs above WCAG AA contrast", () => {
    expect(contrast(rootToken("--ink"), rootToken("--paper"))).toBeGreaterThanOrEqual(7);
    expect(contrast(rootToken("--paper-raised"), rootToken("--chrome"))).toBeGreaterThanOrEqual(7);
    expect(contrast("#ffffff", rootToken("--cyan"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#ffffff", rootToken("--green"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#ffffff", rootToken("--coral"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#ffffff", rootToken("--red"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(rootToken("--evidence"), rootToken("--surface-evidence"))).toBeGreaterThanOrEqual(4.5);
  });

  it("locks the selected signature colors and keeps full-panel roles harmonious", () => {
    expect(rootToken("--chrome")).toBe("#073b4c");
    expect(rootToken("--cyan")).toBe("#007a78");
    expect(rootToken("--coral")).toBe("#c9432d");
    expect(rootToken("--surface-draft")).toBe("#ffdb6e");
    expect(rootToken("--surface-evidence")).toBe("#d9e7ff");

    const surfaceTokens = [
      "--surface-brief",
      "--surface-draft",
      "--surface-reasoning",
      "--surface-evidence",
      "--surface-before",
      "--surface-after",
    ].map(rootToken);
    const surfaceLuminances = surfaceTokens.map(relativeLuminance);

    expect(new Set(surfaceTokens).size).toBe(surfaceTokens.length);
    expect(Math.max(...surfaceLuminances) - Math.min(...surfaceLuminances)).toBeLessThanOrEqual(0.11);
    surfaceTokens.forEach((surface) => {
      expect(contrast(rootToken("--ink"), surface)).toBeGreaterThanOrEqual(7);
    });
    expect(designCss).not.toMatch(/--plum|#70527f|#e8deec|#234b45|#eadbca|#e1e6d5/i);
  });

  it("removes the decorative instruction stripe in the winning cascade", () => {
    const instruction = selectorBlock(".canvas-instruction");
    expect(instruction).toContain("background: var(--cyan-soft)");
    expect(instruction).toContain("border-inline-start-width: 1px");
    expect(instruction).not.toMatch(/box-shadow:\s*inset/i);
    expect(instruction).not.toMatch(/border-inline-start:\s*[2-9]/i);
  });

  it("assigns color to whole product surfaces instead of text-edge decoration", () => {
    expect(selectorBlockContaining(".topbar", "background: var(--chrome)")).toBeTruthy();
    expect(selectorBlockContaining(".problem-rail", "background: var(--surface-brief)")).toBeTruthy();
    expect(selectorBlockContaining(".draft-tray", "background: var(--surface-draft)")).toBeTruthy();
    expect(selectorBlockContaining(".reasoning-rail", "background: var(--surface-reasoning)")).toBeTruthy();
    expect(selectorBlockContaining(".reaction-diff", "background: var(--surface-evidence)")).toBeTruthy();
    expect(selectorBlockContaining(".learning-record", "background: var(--surface-evidence)")).toBeTruthy();
    expect(selectorBlockContaining(".reaction-diff-state--before", "background: var(--surface-before)")).toBeTruthy();
    expect(selectorBlockContaining(".reaction-diff-state--after", "background: var(--surface-after)")).toBeTruthy();
  });
});
