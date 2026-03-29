import { getAgencyConfigBySlug } from "../config/agencies/index.js";
import { brandingAssets } from "./brandingAssets.js";

const fallbackEnv = typeof process !== "undefined" && process.env ? process.env : {};
const browserEnv = typeof window !== "undefined" && window.__APP_ENV__ ? window.__APP_ENV__ : {};

export function getRequestedAgencySlug() {
  return (import.meta.env?.VITE_AGENCY_SLUG || browserEnv.VITE_AGENCY_SLUG || fallbackEnv.VITE_AGENCY_SLUG || "angelic").trim().toLowerCase();
}

export function getAgencyConfig() {
  const base = getAgencyConfigBySlug(getRequestedAgencySlug());
  const assets = brandingAssets[base.branding.assetDir] || brandingAssets.template;
  return {
    ...base,
    appEnv: import.meta.env?.VITE_APP_ENV || browserEnv.VITE_APP_ENV || fallbackEnv.VITE_APP_ENV || "local",
    supportEmailOverride: import.meta.env?.VITE_SUPPORT_EMAIL || browserEnv.VITE_SUPPORT_EMAIL || fallbackEnv.VITE_SUPPORT_EMAIL || base.contact.supportEmail,
    branding: {
      ...base.branding,
      ...assets,
      publicCurrentIcon: "/icons/current/app-icon.svg"
    }
  };
}
