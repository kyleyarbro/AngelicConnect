(function () {
  const defaults = {
    companyName: "Angelic Bail Bonds",
    productName: "Angelic Connect",
    tagline: "Professional support with heart across North Carolina.",
    supportPhone: "(910) 594-4449",
    supportSms: "(910) 594-4449",
    emergencyPhone: "(910) 594-4449",
    supportEmail: "support@angelicbailbonds.com",
    officeAddress: "120 Fayetteville St, Raleigh, NC 27601",
    officeHours: "Mon-Sun · 24/7 response",
    statewideText: "Serving communities across North Carolina.",
    reassuranceText: "You are not alone in this process. We are here to help you stay on track.",
    supportLine: "Fast, discreet support whenever you need us.",
    logoText: "AB",
    theme: {
      primary: "#f5ecdf",
      secondary: "#e5d4bc",
      accent: "#b8844b",
      background: "#fcf8f2",
      surface: "#ffffff",
      surfaceAlt: "#f7f0e6",
      border: "#decebb",
      text: "#2d261f",
      muted: "#786c60",
      success: "#5d8167",
      warning: "#b07b42",
      error: "#b65448"
    }
  };

  const configured = (window.APP_CONFIG && window.APP_CONFIG.brand) || {};
  const brand = {
    ...defaults,
    ...configured,
    theme: { ...defaults.theme, ...(configured.theme || {}) }
  };

  function applyTheme() {
    const root = document.documentElement;
    root.style.setProperty("--brand-primary", brand.theme.primary);
    root.style.setProperty("--brand-secondary", brand.theme.secondary);
    root.style.setProperty("--brand-accent", brand.theme.accent);
    root.style.setProperty("--brand-bg", brand.theme.background);
    root.style.setProperty("--brand-surface", brand.theme.surface);
    root.style.setProperty("--brand-surface-alt", brand.theme.surfaceAlt);
    root.style.setProperty("--brand-border", brand.theme.border);
    root.style.setProperty("--brand-text", brand.theme.text);
    root.style.setProperty("--brand-muted", brand.theme.muted);
    root.style.setProperty("--brand-success", brand.theme.success);
    root.style.setProperty("--brand-warning", brand.theme.warning);
    root.style.setProperty("--brand-error", brand.theme.error);
  }

  function phoneHref(value) {
    return `tel:${String(value).replace(/[^\d+]/g, "")}`;
  }
  function smsHref(value) {
    return `sms:${String(value).replace(/[^\d+]/g, "")}`;
  }

  function hydrateBrandFields(scope = document) {
    scope.querySelectorAll("[data-brand]").forEach((node) => {
      const key = node.dataset.brand;
      if (brand[key]) node.textContent = brand[key];
    });
  }

  applyTheme();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => hydrateBrandFields(document));
  } else hydrateBrandFields(document);

  window.Branding = { get: () => brand, phoneHref, smsHref, hydrateBrandFields };
})();
