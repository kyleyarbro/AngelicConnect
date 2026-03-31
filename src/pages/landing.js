import { getAgencyConfig } from "../lib/agency.js";
import { applyTheme } from "../theme/applyTheme.js";
import { getPlatformProfile } from "../config/platform.js";

function toTelHref(phone = "") {
  const digits = String(phone).replace(/\D/g, "");
  return digits ? `tel:${digits}` : "#";
}

function toMailto(email = "", subject = "") {
  if (!email) return "#";
  const safeSubject = encodeURIComponent(subject);
  return `mailto:${email}?subject=${safeSubject}`;
}

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}

function setHref(id, href) {
  const node = document.getElementById(id);
  if (node) node.setAttribute("href", href);
}

function init() {
  const agency = getAgencyConfig();
  const platform = getPlatformProfile();
  applyTheme(agency);

  document.title = `${platform.brandName} | White-Label Bail Agency Platform`;

  const salesPhone = platform.salesPhone;
  const salesEmail = platform.salesEmail;
  const companyName = platform.brandName;
  const demoSubject = `Request Demo - ${platform.legalName}`;
  const salesMailto = platform.demoCtaHref || toMailto(salesEmail, demoSubject);
  const callHref = platform.contactCtaHref || toTelHref(salesPhone);

  setText("landing-company-name", companyName);
  setText("landing-footer-company", companyName);
  setText("landing-footer-phone", salesPhone);

  setHref("landing-topbar-talk-link", callHref);
  setHref("landing-hero-call-link", callHref);
  setHref("landing-final-call-link", callHref);

  setHref("landing-hero-demo-link", salesMailto);
  setHref("landing-pricing-demo-link", salesMailto);
  setHref("landing-final-demo-link", salesMailto);
  setHref("landing-final-email-link", `mailto:${salesEmail}`);
  setHref("landing-footer-email-link", `mailto:${salesEmail}`);
  setText("landing-footer-email-link", salesEmail);

  const mark = document.getElementById("landing-brand-mark");
  if (mark && platform.platformMarkUrl) {
    mark.setAttribute("src", platform.platformMarkUrl);
    mark.setAttribute("alt", `${companyName} logo`);
  }
}

init();
