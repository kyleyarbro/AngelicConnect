/**
 * @typedef {Object} AgencyContactInfo
 * @property {string} supportPhone
 * @property {string} supportSms
 * @property {string} emergencyPhone
 * @property {string} supportEmail
 * @property {string} officeAddress
 * @property {string} officeHours
 * @property {string} statewideText
 */

/**
 * @typedef {Object} AgencyThemeConfig
 * @property {string} primary
 * @property {string} secondary
 * @property {string} accent
 * @property {string} background
 * @property {string} surface
 * @property {string} surfaceAlt
 * @property {string} border
 * @property {string} text
 * @property {string} muted
 * @property {string} success
 * @property {string} warning
 * @property {string} error
 */

/**
 * @typedef {Object} AgencyBrandingConfig
 * @property {string} assetDir
 * @property {string} logoMarkFile
 * @property {string} wordmarkFile
 * @property {string} publicIconDir
 * @property {string} currentIconName
 */

/**
 * @typedef {Object} AgencyFeatureFlags
 * @property {boolean} enableReminders
 * @property {boolean} enablePayments
 * @property {boolean} enableLiveCheckInCamera
 * @property {boolean} enableSupabaseAuth
 * @property {boolean} enableSupabaseData
 * @property {boolean} enforceAgencyScopeInQueries
 */

/**
 * @typedef {Object} AgencyCheckInRules
 * @property {boolean} requireSelfie
 * @property {boolean} requireLiveCamera
 * @property {boolean} requireLocation
 * @property {string} validationMessage
 * @property {string} cameraPermissionMessage
 */

/**
 * @typedef {Object} AgencyManifestConfig
 * @property {string} themeColor
 * @property {string} backgroundColor
 * @property {string} description
 */

/**
 * @typedef {Object} AgencyConfig
 * @property {string} id
 * @property {string} slug
 * @property {string} appName
 * @property {string} shortName
 * @property {string} companyName
 * @property {string} productName
 * @property {string} tagline
 * @property {string} supportLine
 * @property {string} reassuranceText
 * @property {string} legalDisclaimer
 * @property {AgencyContactInfo} contact
 * @property {AgencyBrandingConfig} branding
 * @property {AgencyThemeConfig} theme
 * @property {AgencyFeatureFlags} features
 * @property {AgencyCheckInRules} checkInRules
 * @property {AgencyManifestConfig} manifest
 */

export {};
