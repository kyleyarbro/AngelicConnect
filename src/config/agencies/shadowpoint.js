/** @type {import("../../types/agency.js").AgencyConfig} */
const shadowpointAgency = {
  id: "shadowpoint",
  slug: "shadowpoint",
  appName: "ShadowPoint Bail Connect",
  shortName: "ShadowPoint",
  companyName: "ShadowPoint Bail",
  productName: "ShadowPoint Bail Connect",
  tagline: "Precise, professional case support with live accountability.",
  supportLine: "Fast-response coordination for active bail operations.",
  reassuranceText: "Need help now? ShadowPoint Bail is here to keep your case on track.",
  legalDisclaimer: "ShadowPoint Bail Connect supports communication and operational follow-through. It does not provide legal advice.",
  contact: {
    supportPhone: "(910) 580-6026",
    supportSms: "(910) 580-6026",
    emergencyPhone: "(910) 580-6026",
    supportEmail: "k.yarbro@outlook.com",
    officeAddress: "ShadowPoint Bail Office",
    officeHours: "Mon-Sun | 24/7 response",
    statewideText: "ShadowPoint Bail support with fast, professional follow-through."
  },
  branding: {
    assetDir: "shadowpoint",
    logoMarkFile: "logo-mark.svg",
    wordmarkFile: "wordmark.svg",
    publicIconDir: "icons/agencies/shadowpoint",
    currentIconName: "app-icon.svg"
  },
  theme: {
    primary: "#0d1828",
    secondary: "#132237",
    accent: "#2f9dff",
    background: "#060b12",
    surface: "#101a2a",
    surfaceAlt: "#121f32",
    border: "#2a3a56",
    text: "#eef5ff",
    muted: "#9caec6",
    success: "#3ebc85",
    warning: "#f0a94c",
    error: "#ff6f6f"
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
    themeColor: "#060b12",
    backgroundColor: "#060b12",
    description: "Mobile-first operations for ShadowPoint Bail."
  }
};

export default shadowpointAgency;
