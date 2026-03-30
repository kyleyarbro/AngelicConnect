/**
 * @param {import("../types/agency.js").AgencyConfig} config
 * @returns {string[]}
 */
export function validateAgencyConfig(config) {
  const errors = [];
  const requiredStrings = [
    ["id", config.id],
    ["slug", config.slug],
    ["appName", config.appName],
    ["shortName", config.shortName],
    ["companyName", config.companyName],
    ["productName", config.productName],
    ["tagline", config.tagline],
    ["supportLine", config.supportLine],
    ["reassuranceText", config.reassuranceText],
    ["legalDisclaimer", config.legalDisclaimer],
    ["contact.supportPhone", config.contact?.supportPhone],
    ["contact.supportEmail", config.contact?.supportEmail],
    ["branding.assetDir", config.branding?.assetDir],
    ["branding.logoMarkFile", config.branding?.logoMarkFile],
    ["branding.wordmarkFile", config.branding?.wordmarkFile],
    ["branding.publicIconDir", config.branding?.publicIconDir],
    ["branding.currentIconName", config.branding?.currentIconName],
    ["manifest.themeColor", config.manifest?.themeColor],
    ["manifest.backgroundColor", config.manifest?.backgroundColor],
    ["manifest.description", config.manifest?.description],
    ["checkInRules.validationMessage", config.checkInRules?.validationMessage],
    ["checkInRules.cameraPermissionMessage", config.checkInRules?.cameraPermissionMessage]
  ];

  for (const [key, value] of requiredStrings) {
    if (typeof value !== "string" || !value.trim()) errors.push(`Missing required string: ${key}`);
  }

  const themeKeys = ["primary", "secondary", "accent", "background", "surface", "surfaceAlt", "border", "text", "muted", "success", "warning", "error"];
  for (const key of themeKeys) {
    if (typeof config.theme?.[key] !== "string" || !config.theme[key].trim()) errors.push(`Missing theme color: theme.${key}`);
  }

  const featureKeys = [
    "enableReminders",
    "enablePayments",
    "enableLiveCheckInCamera",
    "enableSupabaseAuth",
    "enableSupabaseData",
    "enforceAgencyScopeInQueries",
    "enableSupabaseSelfieStorage"
  ];
  for (const key of featureKeys) {
    if (typeof config.features?.[key] !== "boolean") errors.push(`Missing feature flag: features.${key}`);
  }

  const ruleKeys = ["requireSelfie", "requireLiveCamera", "requireLocation"];
  for (const key of ruleKeys) {
    if (typeof config.checkInRules?.[key] !== "boolean") errors.push(`Missing check-in rule: checkInRules.${key}`);
  }

  return errors;
}
