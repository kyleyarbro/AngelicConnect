/** @type {import("../../types/agency.js").AgencyConfig} */
const angelicAgency = {
  id: "angelic",
  slug: "angelic",
  appName: "Angelic Connect",
  shortName: "Angelic",
  companyName: "Angelic Bail Bonds",
  productName: "Angelic Connect",
  tagline: "Professional support with heart across North Carolina.",
  supportLine: "Fast, discreet support whenever you need us.",
  reassuranceText: "You are not alone in this process. We are here to help you stay on track.",
  legalDisclaimer: "Angelic Connect supports communication, reminders, and case coordination. It does not provide legal advice.",
  contact: {
    supportPhone: "(910) 594-4449",
    supportSms: "(910) 594-4449",
    emergencyPhone: "(910) 594-4449",
    supportEmail: "support@angelicbailbonds.com",
    officeAddress: "120 Fayetteville St, Raleigh, NC 27601",
    officeHours: "Mon-Sun · 24/7 response",
    statewideText: "Serving communities across North Carolina."
  },
  branding: {
    assetDir: "angelic",
    logoMarkFile: "logo-mark.svg",
    wordmarkFile: "wordmark.svg",
    publicIconDir: "icons/agencies/angelic",
    currentIconName: "app-icon.svg"
  },
  theme: {
    primary: "#f8f2e8",
    secondary: "#ebdfcf",
    accent: "#b88746",
    background: "#fffdf8",
    surface: "#ffffff",
    surfaceAlt: "#fbf6ef",
    border: "#e3d2bc",
    text: "#1f1913",
    muted: "#6a5b4c",
    success: "#2f7a53",
    warning: "#9d6a2b",
    error: "#af473a"
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
    cameraPermissionMessage: "Please allow front-camera access so we can capture your live check-in selfie."
  },
  manifest: {
    themeColor: "#fffdf8",
    backgroundColor: "#fffdf8",
    description: "Mobile-first support for Angelic Bail Bonds."
  }
};

export default angelicAgency;
