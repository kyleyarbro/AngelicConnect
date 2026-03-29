import { applyAgencyDocumentBranding } from "../components/documentBranding.js";
import { renderBrandMark, renderWordmark } from "../components/brand.js";
import { api } from "../lib/api.js";
import { getAgencyConfig } from "../lib/agency.js";
import { saveSession } from "../lib/session.js";

const agency = getAgencyConfig();
applyAgencyDocumentBranding(agency, "Secure Access");

const app = document.getElementById("app");
const sampleDomain = agency.slug === "angelic" ? "angelicbailbonds.com" : `${agency.slug}bail.com`;

app.innerHTML = `<main class="auth-shell">
  <section class="auth-brand card">
    <div class="brand-pill">
      ${renderBrandMark(agency)}
      <div>
        <p class="eyebrow">${agency.companyName}</p>
        ${renderWordmark(agency)}
      </div>
    </div>
    <p class="muted">${agency.tagline}</p>
    <p class="support-copy">Need help fast? We are here 24/7 with respectful, judgment-free support.</p>
    <div class="list">
      <div class="item compact">
        <strong>Agency support</strong>
        <p class="muted">${agency.contact.statewideText}</p>
      </div>
      <div class="item compact">
        <strong>Stay on track</strong>
        <p class="muted">Check in, review reminders, and reach your team quickly when timing matters.</p>
      </div>
    </div>
    <div class="help-strip">
      <strong>Current agency</strong>
      <p class="muted">${agency.slug}</p>
    </div>
  </section>
  <section class="auth-form card">
    <h2>Secure Sign In</h2>
    <p class="muted">Choose your account type to continue.</p>
    <form id="loginForm">
      <label for="role">Account Type</label>
      <select id="role" name="role" required>
        <option value="defendant">Defendant</option>
        <option value="admin">Staff / Admin</option>
      </select>
      <label for="email">Email</label>
      <input id="email" name="email" type="email" autocomplete="email" required />
      <label for="password">Password</label>
      <input id="password" name="password" type="password" autocomplete="current-password" required />
      <button class="btn btn-primary" type="submit">Continue</button>
    </form>
    <p class="status" id="loginStatus" aria-live="polite"></p>
    <div class="auth-help muted">
      <p><strong>Defendant sample:</strong> defendant@${sampleDomain} / Defendant@123</p>
      <p><strong>Admin sample:</strong> admin@${sampleDomain} / Admin@123</p>
    </div>
  </section>
</main>
<footer class="brand-footer">
  <p>${agency.supportLine}</p>
  <p>${agency.companyName} · ${agency.contact.supportPhone}</p>
</footer>`;

const form = document.getElementById("loginForm");
const status = document.getElementById("loginStatus");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const email = String(formData.get("email")).trim().toLowerCase();
  const password = String(formData.get("password"));
  const role = String(formData.get("role"));

  status.textContent = "Signing in...";
  try {
    const user = await api.login(email, password, role);
    saveSession({ role: user.role, userId: user.id, defendantId: user.defendant_id || null, agencyId: agency.id });
    status.textContent = "Access granted.";
    window.location.href = user.role === "admin" ? "/admin.html" : "/defendant.html";
  } catch (error) {
    status.textContent = error.message;
  }
});
