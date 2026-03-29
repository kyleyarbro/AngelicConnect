import angelicAgency from "./angelic.js";
import shadowpointAgency from "./shadowpoint.js";
import templateAgency from "./template.js";
import { validateAgencyConfig } from "../../lib/validateAgencyConfig.js";

export const agencyRegistry = {
  template: templateAgency,
  angelic: angelicAgency,
  shadowpoint: shadowpointAgency
};

for (const [slug, config] of Object.entries(agencyRegistry)) {
  const errors = validateAgencyConfig(config);
  if (errors.length) {
    throw new Error(`Invalid agency config for "${slug}": ${errors.join("; ")}`);
  }
}

export function listAgencyConfigs() {
  return Object.values(agencyRegistry);
}

export function getAgencyConfigBySlug(slug = "") {
  return agencyRegistry[slug] || templateAgency;
}
