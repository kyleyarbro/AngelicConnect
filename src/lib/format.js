export function fmtDate(value) {
  return new Date(value).toLocaleString();
}

export function fmtShortDate(value) {
  return new Date(value).toLocaleDateString();
}

export function badge(status) {
  const type = /paid|received|active|sent|scheduled/.test(status) ? "ok" : /due|pending|attention/.test(status) ? "warn" : "danger";
  return `<span class="badge ${type}">${status}</span>`;
}

export function phoneHref(value) {
  return `tel:${String(value).replace(/[^\d+]/g, "")}`;
}

export function smsHref(value) {
  return `sms:${String(value).replace(/[^\d+]/g, "")}`;
}
