import { applyTheme } from "../theme/applyTheme.js";

export function applyAgencyDocumentBranding(agency, pageTitle) {
  applyTheme(agency);
  document.title = pageTitle ? `${agency.productName} | ${pageTitle}` : agency.productName;
  document.documentElement.lang = "en";
  document.documentElement.dataset.appEnv = agency.appEnv || "local";
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.setAttribute("content", agency.manifest.themeColor);
  const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (appleTitle) appleTitle.setAttribute("content", agency.shortName);
}
