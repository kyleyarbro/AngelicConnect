import { buildThemeTokens } from "./buildTheme.js";

export function applyTheme(agency) {
  const root = document.documentElement;
  const theme = buildThemeTokens(agency);
  root.style.setProperty("--brand-primary", theme.primary);
  root.style.setProperty("--brand-secondary", theme.secondary);
  root.style.setProperty("--brand-accent", theme.accent);
  root.style.setProperty("--brand-bg", theme.background);
  root.style.setProperty("--brand-surface", theme.surface);
  root.style.setProperty("--brand-surface-alt", theme.surfaceAlt);
  root.style.setProperty("--brand-border", theme.border);
  root.style.setProperty("--brand-text", theme.text);
  root.style.setProperty("--brand-muted", theme.muted);
  root.style.setProperty("--brand-success", theme.success);
  root.style.setProperty("--brand-warning", theme.warning);
  root.style.setProperty("--brand-error", theme.error);
  root.dataset.agency = agency.slug;
}
