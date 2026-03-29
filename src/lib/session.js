import { getAgencyConfig } from "./agency.js";

function prefixKey(name) {
  const agency = getAgencyConfig();
  return `white-label:${agency.slug}:${name}`;
}

export function getSession() {
  return JSON.parse(localStorage.getItem(prefixKey("session")) || "null");
}

export function saveSession(session) {
  localStorage.setItem(prefixKey("session"), JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(prefixKey("session"));
}

export function getDataKey() {
  return prefixKey("data");
}
