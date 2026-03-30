import { getAgencyConfig } from "./agency.js";

function prefixKey(name) {
  const agency = getAgencyConfig();
  const env = agency.appEnv || "local";
  return `white-label:v2:${env}:${agency.id}:${agency.slug}:${name}`;
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
