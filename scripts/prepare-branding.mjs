import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import "./generate-manifest.mjs";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const slug = (process.env.VITE_AGENCY_SLUG || "angelic").trim().toLowerCase();
const sourceDir = join(rootDir, "public", "icons", "agencies", slug);
const currentDir = join(rootDir, "public", "icons", "current");

await mkdir(currentDir, { recursive: true });
for (const file of await readdir(currentDir)) {
  await rm(join(currentDir, file), { force: true, recursive: true });
}
await cp(sourceDir, currentDir, { recursive: true });

console.log(`Prepared branding assets for agency: ${slug}`);
