import { listAgencyConfigs } from "../src/config/agencies/index.js";
import { validateAgencyConfig } from "../src/lib/validateAgencyConfig.js";

let hasErrors = false;

for (const config of listAgencyConfigs()) {
  const errors = validateAgencyConfig(config);
  if (errors.length) {
    hasErrors = true;
    console.error(`\nAgency "${config.slug}" is invalid:`);
    errors.forEach((error) => console.error(`- ${error}`));
  } else {
    console.log(`Validated agency config: ${config.slug}`);
  }
}

if (hasErrors) process.exit(1);
