import { writeFile } from "node:fs/promises";
import { getAgencyConfigBySlug } from "../src/config/agencies/index.js";

const slug = (process.env.VITE_AGENCY_SLUG || "angelic").trim().toLowerCase();
const agency = getAgencyConfigBySlug(slug);

const manifest = {
  name: agency.appName,
  short_name: agency.shortName,
  description: agency.manifest.description,
  start_url: "./login.html",
  display: "standalone",
  background_color: agency.manifest.backgroundColor,
  theme_color: agency.manifest.themeColor,
  icons: [
    {
      src: "./icons/current/app-icon.svg",
      sizes: "any",
      type: "image/svg+xml"
    }
  ]
};

await writeFile(new URL("../public/manifest.json", import.meta.url), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Generated manifest for agency: ${agency.slug}`);
