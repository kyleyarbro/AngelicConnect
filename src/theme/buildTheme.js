export function buildThemeTokens(agency) {
  return {
    primary: agency.theme.primary,
    secondary: agency.theme.secondary,
    accent: agency.theme.accent,
    background: agency.theme.background,
    surface: agency.theme.surface,
    surfaceAlt: agency.theme.surfaceAlt,
    border: agency.theme.border,
    text: agency.theme.text,
    muted: agency.theme.muted,
    success: agency.theme.success,
    warning: agency.theme.warning,
    error: agency.theme.error
  };
}
