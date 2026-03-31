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

function setText(selector, value) {
  document.querySelectorAll(selector).forEach((node) => {
    node.textContent = value;
  });
}

function setHref(selector, href) {
  document.querySelectorAll(selector).forEach((node) => {
    node.setAttribute("href", href);
  });
}

function initMarketingPage() {
  const platform = getPlatformProfile();

  const demoSubject = `Request Demo - ${platform.legalName}`;
  const demoHref = platform.demoCtaHref || toMailto(platform.salesEmail, demoSubject);
  const callHref = platform.contactCtaHref || toTelHref(platform.salesPhone);
  const emailHref = `mailto:${platform.salesEmail}`;

  setText('[data-platform="name"]', platform.brandName);
  setText('[data-platform="phone"]', platform.salesPhone);
  setText('[data-platform="email"]', platform.salesEmail);

  setHref('[data-platform-link="demo"]', demoHref);
  setHref('[data-platform-link="call"]', callHref);
  setHref('[data-platform-link="email"]', emailHref);

  const brandMark = document.getElementById("mk-brand-mark");
  if (brandMark && platform.platformMarkUrl) {
    brandMark.setAttribute("src", platform.platformMarkUrl);
    brandMark.setAttribute("alt", `${platform.brandName} logo`);
  }

  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.setAttribute("content", "#060a12");
}

initMarketingPage();
