import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const reactionGardenCss = readFileSync(join(process.cwd(), "src/soft-orbit.css"), "utf8");

const organicShapeTokens = [
  "--organic-hero",
  "--organic-check",
  "--organic-commit",
  "--organic-undo",
  "--organic-clear",
  "--organic-lab",
] as const;

function tokenValue(name: string): string {
  const match = reactionGardenCss.match(new RegExp(`${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`Missing ${name} from the Reaction Garden tokens.`);
  return match[1].trim();
}

describe("Reaction Garden organic controls", () => {
  it("gives every pivotal action a stable and unique smooth silhouette", () => {
    const shapes = organicShapeTokens.map(tokenValue);

    expect(new Set(shapes).size).toBe(organicShapeTokens.length);
    shapes.forEach((shape) => {
      expect(shape).toMatch(/^(?:\d+%\s+){3}\d+%\s*\/\s*(?:\d+%\s+){3}\d+%$/);
    });
    expect(reactionGardenCss).not.toMatch(/Math\.random|random\s*\(/);
  });

  it("keeps the organic contour on the outside without clipping button content", () => {
    expect(reactionGardenCss).toContain("border-radius: var(--organic-shape, var(--radius-control));");
    expect(reactionGardenCss).not.toMatch(/\.button--organic\s*\{[^}]*clip-path:/s);
    expect(reactionGardenCss).not.toMatch(/\.button--organic\s*\{[^}]*overflow:\s*hidden/s);
  });
});
