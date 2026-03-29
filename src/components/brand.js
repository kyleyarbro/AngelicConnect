export function renderBrandMark(agency, small = false) {
  return `<img class="brand-mark${small ? " small" : ""}" src="${agency.branding.logoMarkUrl}" alt="${agency.companyName} logo mark" />`;
}

export function renderWordmark(agency) {
  return `<img class="brand-wordmark" src="${agency.branding.wordmarkUrl}" alt="${agency.companyName}" />`;
}
