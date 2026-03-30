import { applyTheme } from "../theme/applyTheme.js";
import { registerPwaServiceWorker } from "../lib/pwa.js";

export function applyAgencyDocumentBranding(agency, pageTitle) {
  applyTheme(agency);
  document.title = pageTitle ? `${agency.productName} | ${pageTitle}` : agency.productName;
  document.documentElement.lang = "en";
  document.documentElement.dataset.appEnv = agency.appEnv || "local";

  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.setAttribute("content", agency.manifest.themeColor);

  const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (appleTitle) appleTitle.setAttribute("content", agency.shortName);

  const appNameMeta = document.querySelector('meta[name="application-name"]');
  if (appNameMeta) appNameMeta.setAttribute("content", agency.appName);

  registerPwaServiceWorker();
}
