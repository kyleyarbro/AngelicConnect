/** @type {import("../../types/agency.js").AgencyConfig} */
const templateAgency = {
  id: "template",
  slug: "template",
  appName: "Template Connect",
  shortName: "Template",
  companyName: "Template Bail Agency",
  productName: "Template Connect",
  tagline: "Reusable mobile-first operations for modern bail support.",
  supportLine: "Fast, respectful support for your clients and staff.",
  reassuranceText: "You are not alone in this process. We are here to help you stay on track.",
  legalDisclaimer: "This platform supports communication and compliance reminders. It does not replace legal advice.",
  contact: {
    supportPhone: "(800) 555-0100",
    supportSms: "(800) 555-0100",
    emergencyPhone: "(800) 555-0100",
    supportEmail: "support@templatebail.com",
    officeAddress: "100 Main Street, Example City, NC 27500",
    officeHours: "Mon-Sun · 24/7 response",
    statewideText: "Serving clients with clarity, speed, and professionalism."
  },
  branding: {
    assetDir: "template",
    logoMarkFile: "logo-mark.svg",
    wordmarkFile: "wordmark.svg",
    publicIconDir: "icons/agencies/template",
    currentIconName: "app-icon.svg"
  },
  theme: {
    primary: "#eef3f5",
    secondary: "#d7e4e8",
    accent: "#2c7285",
    background: "#f7fafb",
    surface: "#ffffff",
    surfaceAlt: "#edf5f7",
    border: "#c5d7dd",
    text: "#1c2b32",
    muted: "#5d7179",
    success: "#4e8b6d",
    warning: "#af7e31",
    error: "#b55449"
  },
  features: {
    enableReminders: true,
    enablePayments: true,
    enableLiveCheckInCamera: true,
    enableSupabaseAuth: false,
    enableSupabaseData: false,
    enforceAgencyScopeInQueries: true,
    enableSupabaseSelfieStorage: false
  },
  checkInRules: {
    requireSelfie: true,
    requireLiveCamera: true,
    requireLocation: false,
    validationMessage: "A live selfie is required to complete check-in.",
    cameraPermissionMessage: "Camera access is required for live selfie check-ins."
  },
  manifest: {
    themeColor: "#f7fafb",
    backgroundColor: "#f7fafb",
    description: "White-label mobile-first bail agency operations."
  }
};

export default templateAgency;
