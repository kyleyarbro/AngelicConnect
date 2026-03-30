/** @type {import("../../types/agency.js").AgencyConfig} */
const shadowpointAgency = {
  id: "shadowpoint",
  slug: "shadowpoint",
  appName: "Shadowpoint Connect",
  shortName: "Shadowpoint",
  companyName: "Shadowpoint Bail Agency",
  productName: "Shadowpoint Connect",
  tagline: "Clear, modern case support for fast-moving teams.",
  supportLine: "Responsive field-ready coordination with a calm, professional tone.",
  reassuranceText: "We keep communication clear so clients and staff can stay focused on the next step.",
  legalDisclaimer: "Shadowpoint Connect supports operational follow-through and communication. It does not replace legal advice.",
  contact: {
    supportPhone: "(702) 555-0190",
    supportSms: "(702) 555-0190",
    emergencyPhone: "(702) 555-0191",
    supportEmail: "support@shadowpointbail.com",
    officeAddress: "800 Carson Ave, Las Vegas, NV 89101",
    officeHours: "Mon-Sun · 24/7 response",
    statewideText: "Serving clients with precise updates and steady support."
  },
  branding: {
    assetDir: "shadowpoint",
    logoMarkFile: "logo-mark.svg",
    wordmarkFile: "wordmark.svg",
    publicIconDir: "icons/agencies/shadowpoint",
    currentIconName: "app-icon.svg"
  },
  theme: {
    primary: "#e8eff1",
    secondary: "#cfdbdf",
    accent: "#1d6b73",
    background: "#f6fafb",
    surface: "#ffffff",
    surfaceAlt: "#edf5f6",
    border: "#c5d3d6",
    text: "#16252b",
    muted: "#5d7278",
    success: "#4f8a68",
    warning: "#a97c34",
    error: "#b64e48"
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
    cameraPermissionMessage: "Please allow camera access to capture a live check-in selfie."
  },
  manifest: {
    themeColor: "#f6fafb",
    backgroundColor: "#f6fafb",
    description: "Mobile-first operations for Shadowpoint Bail Agency."
  }
};

export default shadowpointAgency;
