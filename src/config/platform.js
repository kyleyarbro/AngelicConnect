const fallbackEnv = typeof process !== "undefined" && process.env ? process.env : {};
const browserEnv = typeof window !== "undefined" && window.__APP_ENV__ ? window.__APP_ENV__ : {};
const runtimeEnv = {
  ...(import.meta.env || {}),
  ...fallbackEnv,
  ...browserEnv
};

export function getPlatformProfile() {
  const defaultEmail = "hello@shadowpointsystems.com";
  const defaultPhone = "(919) 555-0148";
  return {
    brandName: runtimeEnv.VITE_PLATFORM_BRAND_NAME || "ShadowPoint Systems",
    legalName: runtimeEnv.VITE_PLATFORM_LEGAL_NAME || "ShadowPoint Systems",
    salesPhone: runtimeEnv.VITE_PLATFORM_SALES_PHONE || defaultPhone,
    salesEmail: runtimeEnv.VITE_PLATFORM_SALES_EMAIL || defaultEmail,
    platformMarkUrl: runtimeEnv.VITE_PLATFORM_MARK_URL || "/assets/icons/platform-mark.svg",
    demoCtaHref: runtimeEnv.VITE_PLATFORM_DEMO_CTA_HREF || "",
    contactCtaHref: runtimeEnv.VITE_PLATFORM_CONTACT_CTA_HREF || ""
  };
}
