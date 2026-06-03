import { existsSync, mkdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const distDir = resolve(root, "extension/dist");
const releaseDir = resolve(root, "release");
const zipPath = resolve(releaseDir, "sokbaro-ai-extension-0.1.0.zip");

if (!existsSync(distDir)) {
  throw new Error("extension/dist does not exist. Run npm run build:ext first.");
}

mkdirSync(releaseDir, { recursive: true });
rmSync(zipPath, { force: true });

execFileSync(
  "zip",
  [
    "-r",
    zipPath,
    ".",
    "-x",
    "*.DS_Store",
    "__MACOSX/*",
    "*.map",
    "*.svg",
    "icons/*.svg",
  ],
  {
    cwd: distDir,
    stdio: "inherit",
  },
);

console.log(`Packaged Chrome extension: ${zipPath}`);
