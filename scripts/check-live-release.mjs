import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const baseUrl = "https://mihirduvedi.github.io/mechanism-canvas/";
const failures = [];

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function fetchBytes(relativeUrl) {
  const url = new URL(relativeUrl, baseUrl);
  url.searchParams.set("release_check", Date.now().toString());
  const response = await fetch(url, { headers: { "cache-control": "no-cache" } });
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!response.ok) failures.push(`${url.pathname} returned HTTP ${response.status}`);
  return { bytes, response, url };
}

const page = await fetchBytes("?demo=1");
const html = page.bytes.toString("utf8");

for (const pattern of [
  /<title>Mechanism Canvas<\/title>/,
  /rel="canonical" href="https:\/\/mihirduvedi\.github\.io\/mechanism-canvas\/"/,
  /property="og:image"\s+content="https:\/\/mihirduvedi\.github\.io\/mechanism-canvas\/mechanism-canvas-social-card\.png"/,
]) {
  if (!pattern.test(html)) failures.push(`Live HTML is missing ${pattern}`);
}

const assetPaths = [
  ...html.matchAll(/(?:src|href)="((?:\.\/|\/mechanism-canvas\/)assets\/[^"]+\.(?:css|js))"/g),
].map((match) => match[1]);

if (assetPaths.length < 2) failures.push("Live HTML did not expose both built JavaScript and CSS assets");

for (const publicPath of [...new Set(assetPaths)]) {
  const relativePath = publicPath.replace(/^\.\//, "").replace(/^\/mechanism-canvas\//, "");
  const localPath = join(root, "dist", relativePath);
  if (!existsSync(localPath)) {
    failures.push(`Local build is missing ${relativePath}`);
    continue;
  }
  const remote = await fetchBytes(publicPath);
  const localBytes = readFileSync(localPath);
  if (remote.response.ok && sha256(remote.bytes) !== sha256(localBytes)) {
    failures.push(`Live ${relativePath} does not match the local build`);
  }
}

const liveCard = await fetchBytes("mechanism-canvas-social-card.png");
const localCardPath = join(root, "public", "mechanism-canvas-social-card.png");
if (!existsSync(localCardPath)) {
  failures.push("Local social card is missing");
} else if (liveCard.response.ok && sha256(liveCard.bytes) !== sha256(readFileSync(localCardPath))) {
  failures.push("Live social card does not match the local source");
}

if (failures.length) {
  console.error("Live release checks failed:\n" + failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`Live release checks passed (${new Set(assetPaths).size} built assets and social card match ${baseUrl}).`);
