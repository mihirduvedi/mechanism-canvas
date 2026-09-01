import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const failures = [];
const releaseMode = process.argv.includes("--release");

function requireFile(relativePath) {
  const absolutePath = join(root, relativePath);
  if (!existsSync(absolutePath)) failures.push(`Missing required file: ${relativePath}`);
  return absolutePath;
}

function requireText(relativePath, patterns) {
  const text = readFileSync(requireFile(relativePath), "utf8");
  for (const pattern of patterns) {
    if (!pattern.test(text)) failures.push(`${relativePath} is missing ${pattern}`);
  }
  return text;
}

const packageJson = JSON.parse(readFileSync(requireFile("package.json"), "utf8"));
if (packageJson.license !== "MIT") failures.push("package.json must declare the MIT license");

requireFile("LICENSE");
requireFile("THIRD_PARTY_NOTICES.md");
requireFile("HACKATHON.md");
requireFile("docs/README.md");
requireFile("docs/SUBMISSION_CHECKLIST.md");
requireFile("docs/JUDGE_GUIDE.md");

requireText("README.md", [
  /mihirduvedi\.github\.io\/mechanism-canvas\/\?demo=1/,
  /github\.com\/mihirduvedi\/mechanism-canvas/,
  /youtu\.be\/UXbloTA5bqU/,
  /16 → 21 → 15 → 4/,
]);

requireText("index.html", [
  /name="description"/,
  /property="og:image"/,
  /rel="canonical"/,
]);

const registerSource = requireText("src/webmcp/register-tools.ts", [
  /document\.modelContext/,
  /context\.registerTool\(/,
]);
const catalogSource = requireText("src/webmcp/tool-catalog.ts", [/MECHANISM_TOOL_COUNT/]);
if (!registerSource.includes("enabledToolNames")) failures.push("Registration must use the adaptive policy surface");
if (!catalogSource.includes("WEBMCP_TOOL_CATALOG.length")) failures.push("Tool count must derive from the catalog");

const devpostCopy = requireText("docs/DEVPOST_SUBMISSION.md", [
  /\*\*Project name:\*\* Mechanism Canvas/,
  /\*\*Tagline:\*\*/,
  /Why WebMCP fits/,
  /How WebMCP is implemented/,
]);
const tagline = devpostCopy.match(/\*\*Tagline:\*\* (.+)/)?.[1] ?? "";
if (!tagline) failures.push("Devpost tagline could not be parsed");
if (tagline.length > 140) failures.push(`Devpost tagline is ${tagline.length} characters; maximum is 140`);
const videoUrl = devpostCopy.match(/\*\*Video demo link:\*\* <(https:\/\/youtu\.be\/[^>]+)>/)?.[1] ?? "";
if (!videoUrl) failures.push("Devpost video demo link must contain a YouTube share URL");

const socialCard = requireFile("public/mechanism-canvas-social-card.png");
if (existsSync(socialCard)) {
  const bytes = readFileSync(socialCard);
  const isPng = bytes.subarray(1, 4).toString("ascii") === "PNG";
  const width = isPng && bytes.length >= 24 ? bytes.readUInt32BE(16) : 0;
  const height = isPng && bytes.length >= 24 ? bytes.readUInt32BE(20) : 0;
  if (!isPng) failures.push("Submission thumbnail must be a PNG");
  if (width !== 1800 || height !== 1200) failures.push(`Submission thumbnail is ${width}×${height}; expected 1800×1200`);
  if (statSync(socialCard).size > 5 * 1024 * 1024) failures.push("Submission thumbnail exceeds Devpost's 5 MB limit");
}
requireFile("public/mechanism-canvas-social-card.svg");

const trackedFiles = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" })
  .trim()
  .split("\n")
  .filter(Boolean);
const trackedHandoffs = trackedFiles.filter((file) => file.startsWith("handoffs/"));
if (trackedHandoffs.length) failures.push(`Private handoffs remain tracked: ${trackedHandoffs.join(", ")}`);
const trackedWorkFiles = trackedFiles.filter((file) => file.startsWith("work/"));
if (trackedWorkFiles.length) failures.push(`Private work artifacts remain tracked: ${trackedWorkFiles.join(", ")}`);
const trackedOutputFiles = trackedFiles.filter((file) => file.startsWith("output/"));
if (trackedOutputFiles.length) failures.push(`Private output artifacts remain tracked: ${trackedOutputFiles.join(", ")}`);

if (releaseMode) {
  const releaseRequiredFiles = [
    ".gitignore",
    "README.md",
    "HACKATHON.md",
    "LICENSE",
    "THIRD_PARTY_NOTICES.md",
    "docs/DEVPOST_SUBMISSION.md",
    "docs/JUDGE_GUIDE.md",
    "docs/README.md",
    "docs/SUBMISSION_CHECKLIST.md",
    "index.html",
    "package-lock.json",
    "package.json",
    "public/mechanism-canvas-mark.svg",
    "public/mechanism-canvas-social-card.png",
    "public/mechanism-canvas-social-card.svg",
    "scripts/check-live-release.mjs",
    "scripts/check-submission.mjs",
    "src/webmcp/register-tools.ts",
  ];
  const untrackedRequiredFiles = releaseRequiredFiles.filter((file) => !trackedFiles.includes(file));
  if (untrackedRequiredFiles.length) {
    failures.push(`Release files are not tracked: ${untrackedRequiredFiles.join(", ")}`);
  }

  const worktreeStatus = execFileSync(
    "git",
    ["status", "--porcelain=v1", "--untracked-files=all"],
    { cwd: root, encoding: "utf8" },
  ).trim();
  if (worktreeStatus) failures.push("Release verification requires a clean non-ignored worktree");

  const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  const remoteLine = execFileSync("git", ["ls-remote", "origin", "refs/heads/main"], {
    cwd: root,
    encoding: "utf8",
  }).trim();
  const remoteHead = remoteLine.split(/\s+/)[0] ?? "";
  if (!remoteHead) failures.push("Could not resolve origin/main from the remote");
  if (remoteHead && head !== remoteHead) failures.push(`Local HEAD ${head} does not match origin/main ${remoteHead}`);
}

const textExtensions = new Set([".css", ".html", ".js", ".json", ".md", ".mjs", ".svg", ".ts", ".tsx", ".yml"]);
for (const relativePath of trackedFiles) {
  const extension = relativePath.slice(relativePath.lastIndexOf("."));
  if (!textExtensions.has(extension)) continue;
  const absolutePath = join(root, relativePath);
  // Submission verification is intentionally usable before a release commit.
  // A tracked file staged for deletion is absent from the working tree; release
  // mode's clean-tree check still prevents such a state from shipping.
  if (!existsSync(absolutePath)) continue;
  const text = readFileSync(absolutePath, "utf8");
  if (/\/Users\/[^/]+\//.test(text)) failures.push(`Tracked file contains an absolute user path: ${relativePath}`);
  if (/BEGIN [A-Z ]+PRIVATE KEY|sk-[A-Za-z0-9]{20,}/.test(text)) failures.push(`Tracked file may contain a secret: ${relativePath}`);
}

if (failures.length) {
  console.error(`${releaseMode ? "Release-state" : "Submission"} checks failed:\n` + failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`${releaseMode ? "Release-state" : "Submission"} checks passed (${trackedFiles.length} tracked files; tagline ${tagline.length}/140; thumbnail 1800×1200 under 5 MB).`);
console.log(`Video demo: ${videoUrl}`);
console.log("Intentional external fields still pending: owner-confirmed Devpost registration, eligibility, rights, and team details.");
