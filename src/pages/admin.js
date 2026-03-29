import { applyAgencyDocumentBranding } from "../components/documentBranding.js";
import { renderBrandMark } from "../components/brand.js";
import { api } from "../lib/api.js";
import { getAgencyConfig } from "../lib/agency.js";
import { fmtDate } from "../lib/format.js";
import { getSession } from "../lib/session.js";

const session = getSession();
if (!session || session.role !== "admin") window.location.href = "/login.html";

const agency = getAgencyConfig();
applyAgencyDocumentBranding(agency, "Staff Console");

const state = {
  tab: "dashboard",
  data: null,
  selectedDefendantId: null,
  search: "",
  showAddForm: false,
  filters: { active: "all", bond: "all", missed: "all", court: "all", payment: "all" }
};

const menu = [["dashboard", "Dashboard"], ["defendants", "Defendant List"], ["reminders", "Reminder Center"], ["activity", "Activity Log"]];
const app = document.getElementById("app");
let modalEventsBound = false;

function formatCurrency(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "";
  return value.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

function formatLocationLabel(location) {
  if (!location) return "";
  if (location.city && location.state) return `${location.city}, ${location.state}`;
  if (typeof location.latitude === "number" && typeof location.longitude === "number") {
    return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  }
  return "";
}

function normalizeActivityEntry(activity, data) {
  const entry = { ...activity };
  if (entry.check_in_id) {
    const linkedCheckIn = data.check_ins.find((checkIn) => checkIn.id === entry.check_in_id);
    if (linkedCheckIn) {
      entry.selfie_data_url = entry.selfie_data_url || linkedCheckIn.selfie_data_url || "";
      entry.location = entry.location || {
        latitude: linkedCheckIn.latitude ?? null,
        longitude: linkedCheckIn.longitude ?? null
      };
    }
  }
  return entry;
}

function isValidImageSource(value) {
  if (typeof value !== "string") return false;
  const src = value.trim();
  if (!src) return false;
  if (/^data:image\/[a-zA-Z+.-]+;base64,/.test(src)) return true;
  if (/^data:image\/[a-zA-Z+.-]+,/.test(src)) return true;
  if (/^blob:/.test(src)) return true;
  if (/^https?:\/\//.test(src)) return true;
  if (/^(\/|\.\/|\.\.\/)/.test(src)) return true;
  return false;
}

function getActivityPreviewSource(entry) {
  const selfie = entry.selfie_data_url || entry.selfie_url || entry.selfie_path || "";
  return isValidImageSource(selfie) ? selfie : "";
}

function closeActivityImageModal() {
  const modal = document.getElementById("activityImageModal");
  const image = document.getElementById("activityImagePreview");
  const fallback = document.getElementById("activityImageError");
  if (modal) {
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
  }
  if (image) {
    image.removeAttribute("src");
    image.hidden = true;
  }
  if (fallback) fallback.hidden = true;
  document.body.classList.remove("modal-open");
}

function openActivityImageModal(source) {
  const modal = document.getElementById("activityImageModal");
  const image = document.getElementById("activityImagePreview");
  const fallback = document.getElementById("activityImageError");
  if (!modal || !image || !isValidImageSource(source)) return;

  closeActivityImageModal();
  image.hidden = true;
  if (fallback) fallback.hidden = true;
  image.src = source;
  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function ensureActivityModalBindings() {
  if (modalEventsBound) return;
  const modal = document.getElementById("activityImageModal");
  const closeModalButton = document.getElementById("closeActivityImageModal");
  const image = document.getElementById("activityImagePreview");
  const fallback = document.getElementById("activityImageError");
  if (!modal || !closeModalButton || !image) return;

  closeModalButton.addEventListener("click", closeActivityImageModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeActivityImageModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) closeActivityImageModal();
  });
  image.addEventListener("load", () => {
    image.hidden = false;
    if (fallback) fallback.hidden = true;
  });
  image.addEventListener("error", () => {
    image.hidden = true;
    if (fallback) fallback.hidden = false;
  });

  app.addEventListener("click", (event) => {
    const thumbButton = event.target.closest(".activity-thumb-btn.is-clickable");
    if (!thumbButton || !app.contains(thumbButton)) return;
    const thumbImage = thumbButton.querySelector(".activity-thumb");
    const source = thumbImage?.getAttribute("src") || "";
    if (!isValidImageSource(source)) return;
    openActivityImageModal(source);
  });

  modalEventsBound = true;
}

function renderActivityFeed(activities, data) {
  if (!activities.length) return `<div class="help-strip">No activity has been recorded yet.</div>`;
  return activities.map((activity) => {
    const entry = normalizeActivityEntry(activity, data);
    const previewSource = getActivityPreviewSource(entry);
    const hasPreview = !!previewSource;
    const thumb = hasPreview
      ? `<button type="button" class="activity-thumb-btn is-clickable" aria-label="Open check-in selfie"><img class="activity-thumb" src="${previewSource}" alt="Check-in selfie thumbnail" loading="lazy" /></button>`
      : `<div class="activity-thumb-placeholder" aria-hidden="true"></div>`;
    const payment = typeof entry.payment_amount === "number" ? `<span class="badge warn">Payment ${formatCurrency(entry.payment_amount)}</span>` : "";
    const location = formatLocationLabel(entry.location);
    const locationHtml = location ? `<p class="muted activity-location">Location: ${location}</p>` : "";
    const shouldShowNoSelfie = !hasPreview && (entry.type === "check_in" || /check-?in/i.test(entry.text || ""));
    const noSelfie = shouldShowNoSelfie ? `<p class="muted activity-missing-selfie">No selfie available</p>` : "";
    return `<article class="item activity-row">
      <div class="activity-left">${thumb}</div>
      <div class="activity-main">
        <p class="activity-text"><strong>${entry.text}</strong></p>
        ${locationHtml}
        ${noSelfie}
      </div>
      <div class="activity-meta">
        ${payment}
        <span class="muted activity-time">${fmtDate(entry.at)}</span>
      </div>
    </article>`;
  }).join("");
}

function renderShell() {
  app.innerHTML = `<header class="topbar">
    <div class="brand-pair">
      ${renderBrandMark(agency, true)}
      <div>
        <p class="eyebrow">${agency.companyName}</p>
        <h1>Staff Console</h1>
      </div>
    </div>
    <button id="logoutBtn" class="btn btn-outline">Logout</button>
  </header>
  <main class="main-content admin-layout">
    <aside class="admin-sidebar card" id="adminSidebar"></aside>
    <section class="admin-panel" id="adminMain"></section>
  </main>
  <div class="image-modal" id="activityImageModal" hidden aria-hidden="true">
    <div class="image-modal-inner card">
      <button class="btn btn-outline image-modal-close" id="closeActivityImageModal" type="button">Close</button>
      <img id="activityImagePreview" class="image-modal-preview" alt="Check-in selfie full size preview" />
      <p id="activityImageError" class="muted image-modal-error" hidden>Unable to load selfie preview.</p>
    </div>
  </div>`;
  ensureActivityModalBindings();
  document.getElementById("logoutBtn").onclick = () => { api.logout(); window.location.href = "/login.html"; };
}

function renderSidebar() {
  const sidebar = document.getElementById("adminSidebar");
  sidebar.innerHTML = `<p class="eyebrow">${agency.companyName}</p><h3>Case Operations</h3><p class="muted">${agency.supportLine}</p><div class="menu">${menu.map(([key, value]) => `<button class="btn ${state.tab === key ? "btn-primary" : "btn-outline"}" data-tab="${key}">${value}</button>`).join("")}</div><div class="help-strip"><strong>Contact</strong><p class="muted">${agency.contact.supportPhone}<br/>${agency.supportEmailOverride || agency.contact.supportEmail}</p></div>`;
  sidebar.querySelectorAll("button").forEach((button) => button.onclick = () => { state.tab = button.dataset.tab; renderSidebar(); render(); });
}

function applySnapshotFilter(filterSet) {
  state.filters = { ...state.filters, ...filterSet };
  state.tab = "defendants";
  renderSidebar();
  render();
}

function clearFilters() {
  state.search = "";
  state.filters = { active: "all", bond: "all", missed: "all", court: "all", payment: "all" };
  render();
}

function defendantRows() {
  const data = state.data;
  const courts = Object.fromEntries(data.court_dates.map((court) => [court.defendant_id, court]));
  const unpaidIds = new Set(data.payments.filter((payment) => payment.status !== "paid").map((payment) => payment.defendant_id));
  return data.defendants.filter((defendant) => {
    const searchMatch = `${defendant.full_name} ${defendant.email}`.toLowerCase().includes(state.search.toLowerCase());
    const activeMatch = state.filters.active === "all" || String(defendant.active) === state.filters.active;
    const bondMatch = state.filters.bond === "all" || defendant.bond_status === state.filters.bond;
    const missedMatch = state.filters.missed === "all" || String(defendant.missed_check_in) === state.filters.missed;
    const courtMatch = state.filters.court === "all" || (courts[defendant.id] && new Date(courts[defendant.id].court_datetime) <= new Date(Date.now() + 7 * 86400000));
    const paymentMatch = state.filters.payment === "all" || unpaidIds.has(defendant.id);
    return searchMatch && activeMatch && bondMatch && missedMatch && courtMatch && paymentMatch;
  });
}

function markActivity(text, meta = {}) {
  state.data.activity.unshift({ agency_id: agency.id, at: new Date().toISOString(), text, ...meta });
  api.saveData(state.data);
}

function addDefendantSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const fd = new FormData(form);
  const now = new Date().toISOString();
  const idStamp = Date.now();
  const defendantId = `def-${idStamp}`;
  const emergency = String(fd.get("emergency_contact") || "").trim();
  const [emergencyName, emergencyPhone] = emergency.split("|").map((value) => value?.trim() || "");
  const defendant = {
    id: defendantId,
    agency_id: agency.id,
    full_name: String(fd.get("full_name")).trim(),
    dob: String(fd.get("dob") || ""),
    phone: String(fd.get("phone") || "").trim(),
    email: String(fd.get("email") || "").trim(),
    emergency_contact_name: emergencyName || "Not provided",
    emergency_contact_phone: emergencyPhone || "Not provided",
    active: String(fd.get("active")) === "true",
    bond_status: String(fd.get("bond_status")),
    missed_check_in: false,
    bail_agent_name: "Assigned Agent"
  };
  const bond = {
    id: `bond-${idStamp}`,
    agency_id: agency.id,
    defendant_id: defendantId,
    bond_number: String(fd.get("bond_number")).trim(),
    bond_amount: Number(fd.get("bond_amount") || 0),
    status: String(fd.get("bond_status")),
    charges: "",
    conditions: "Follow court schedule and required check-in process.",
    indemnitor_name: String(fd.get("indemnitor") || "").trim() || "Not provided",
    indemnitor_phone: "",
    company_name: agency.companyName,
    company_phone: agency.contact.supportPhone,
    company_email: agency.supportEmailOverride || agency.contact.supportEmail
  };
  const court = {
    id: `court-${idStamp}`,
    agency_id: agency.id,
    defendant_id: defendantId,
    court_datetime: new Date(String(fd.get("court_datetime"))).toISOString(),
    court_address: String(fd.get("court_address") || "").trim(),
    status: "scheduled"
  };
  const payment = {
    id: `pay-${idStamp}`,
    agency_id: agency.id,
    defendant_id: defendantId,
    amount_due: Number(fd.get("bond_amount") || 0),
    due_date: String(fd.get("payment_due_date") || ""),
    status: String(fd.get("payment_status")),
    paid_at: null,
    method: null,
    note: "New case intake payment schedule"
  };
  const noteBody = String(fd.get("note") || "").trim();
  if (noteBody) state.data.notes.unshift({ id: `note-${idStamp}`, agency_id: agency.id, defendant_id: defendantId, author_name: "Staff", body: noteBody, created_at: now });
  state.data.defendants.unshift(defendant);
  state.data.bonds.unshift(bond);
  state.data.court_dates.unshift(court);
  state.data.payments.unshift(payment);
  state.selectedDefendantId = defendantId;
  state.showAddForm = false;
  markActivity(`Defendant added: ${defendant.full_name}.`, { type: "defendant_add", defendant_id: defendantId });
  api.saveData(state.data);
  state.tab = "defendants";
  renderSidebar();
  render();
}

function render() {
  closeActivityImageModal();
  const main = document.getElementById("adminMain");
  const data = state.data;
  if (!state.selectedDefendantId) state.selectedDefendantId = data.defendants[0]?.id;
  const selected = data.defendants.find((defendant) => defendant.id === state.selectedDefendantId);

  if (state.tab === "dashboard") {
    const active = data.defendants.filter((defendant) => defendant.active).length;
    const upcoming = data.court_dates.filter((court) => new Date(court.court_datetime) > new Date() && new Date(court.court_datetime) <= new Date(Date.now() + 7 * 86400000)).length;
    const pendingPayments = data.payments.filter((payment) => payment.status !== "paid").length;
    const missed = data.defendants.filter((defendant) => defendant.missed_check_in).length;
    main.innerHTML = `<section class="section-stack">
      <article class="card dashboard-overview"><p class="eyebrow dashboard-eyebrow">Operations overview</p><h2 class="dashboard-title">Current case priorities</h2><div class="grid two dashboard-kpis">
        <button class="metric kpi-card" data-kpi="active"><p class="kpi-label">Active defendants</p><p class="value">${active}</p></button>
        <button class="metric kpi-card" data-kpi="court"><p class="kpi-label">Court dates (7 days)</p><p class="value">${upcoming}</p></button>
        <button class="metric kpi-card" data-kpi="payment"><p class="kpi-label">Pending payments</p><p class="value">${pendingPayments}</p></button>
        <button class="metric kpi-card" data-kpi="missed"><p class="kpi-label">Missed check-ins</p><p class="value">${missed}</p></button>
      </div></article>
      <article class="card"><h3>Recent activity</h3><div class="list" id="activityPreviewList">${renderActivityFeed(data.activity.slice(0, 12), data)}</div></article>
    </section>`;
    main.querySelectorAll(".kpi-card").forEach((card) => {
      card.onclick = () => {
        if (card.dataset.kpi === "active") applySnapshotFilter({ active: "true" });
        if (card.dataset.kpi === "court") applySnapshotFilter({ court: "upcoming" });
        if (card.dataset.kpi === "payment") applySnapshotFilter({ payment: "pending" });
        if (card.dataset.kpi === "missed") applySnapshotFilter({ missed: "true" });
      };
    });
    return;
  }

  if (state.tab === "defendants") {
    const rows = defendantRows();
    const hasFilter = state.search || Object.values(state.filters).some((value) => value !== "all");
    main.innerHTML = `<section class="card">
      <div class="toolbar-row">
        <div><h2>Defendant directory</h2><p class="muted">Search and filter quickly to coordinate case support.</p></div>
        <button id="addDefendantBtn" class="btn btn-primary">Add Defendant</button>
      </div>
      ${hasFilter ? `<div class="filter-chip-row"><span class="badge warn">Filters active</span><button id="clearFiltersBtn" class="btn btn-outline">Clear filters</button></div>` : ""}
      ${state.showAddForm ? `<form id="addDefendantForm" class="card add-form">
        <h3>New defendant intake</h3>
        <div class="grid two">
          <label>Full name<input name="full_name" required /></label>
          <label>Phone<input name="phone" required /></label>
          <label>Email<input name="email" type="email" required /></label>
          <label>Date of birth<input name="dob" type="date" required /></label>
          <label>Emergency contact (name | phone)<input name="emergency_contact" placeholder="Jordan Lee | (919) 555-0101" required /></label>
          <label>Bond number<input name="bond_number" required /></label>
          <label>Bond amount<input name="bond_amount" type="number" min="0" step="0.01" required /></label>
          <label>Bond status<select name="bond_status"><option value="active">Active</option><option value="closed">Closed</option><option value="revoked">Revoked</option></select></label>
          <label>Court date/time<input name="court_datetime" type="datetime-local" required /></label>
          <label>Court address<input name="court_address" required /></label>
          <label>Payment due date<input name="payment_due_date" type="date" required /></label>
          <label>Payment status<select name="payment_status"><option value="due">Due</option><option value="pending">Pending</option><option value="paid">Paid</option><option value="overdue">Overdue</option></select></label>
          <label>Indemnitor<input name="indemnitor" /></label>
          <label>Active status<select name="active"><option value="true">Active</option><option value="false">Inactive</option></select></label>
        </div>
        <label>Notes<textarea name="note" placeholder="Internal intake note"></textarea></label>
        <div class="toolbar-row"><button type="submit" class="btn btn-primary">Create Defendant</button><button type="button" id="cancelAddDefendant" class="btn btn-outline">Cancel</button></div>
      </form>` : ""}
      <div class="filters grid two">
        <input id="searchInput" placeholder="Search by name or email" value="${state.search}" />
        <select id="activeFilter"><option value="all">All status</option><option value="true">Active</option><option value="false">Inactive</option></select>
        <select id="bondFilter"><option value="all">All bond statuses</option><option value="active">Active bond</option><option value="closed">Closed bond</option></select>
        <select id="missedFilter"><option value="all">All check-in flags</option><option value="true">Missed check-in</option><option value="false">No missed check-in</option></select>
        <select id="courtFilter"><option value="all">All court windows</option><option value="upcoming">Court in 7 days</option></select>
        <select id="paymentFilter"><option value="all">All payment states</option><option value="pending">Pending / unpaid</option></select>
      </div>
      <div style="overflow:auto;"><table class="table"><thead><tr><th>Name</th><th>Bond</th><th>Court</th><th>Missed</th><th>Active</th></tr></thead>
      <tbody>${rows.map((defendant) => {
        const court = data.court_dates.find((item) => item.defendant_id === defendant.id);
        return `<tr><td><button class="name-link" data-id="${defendant.id}">${defendant.full_name}</button><br/><span class="muted">${defendant.email}</span></td><td>${defendant.bond_status}</td><td>${court ? new Date(court.court_datetime).toLocaleDateString() : "N/A"}</td><td>${defendant.missed_check_in ? "Yes" : "No"}</td><td>${defendant.active ? "Yes" : "No"}</td></tr>`;
      }).join("")}</tbody></table></div>
      ${rows.length ? "" : `<div class="help-strip">No defendants match these filters.</div>`}
    </section>`;
    document.getElementById("addDefendantBtn").onclick = () => { state.showAddForm = !state.showAddForm; render(); };
    if (hasFilter) document.getElementById("clearFiltersBtn").onclick = clearFilters;
    if (state.showAddForm) {
      document.getElementById("addDefendantForm").onsubmit = addDefendantSubmit;
      document.getElementById("cancelAddDefendant").onclick = () => { state.showAddForm = false; render(); };
    }
    document.getElementById("searchInput").oninput = (event) => { state.search = event.target.value; render(); };
    document.getElementById("activeFilter").value = state.filters.active;
    document.getElementById("bondFilter").value = state.filters.bond;
    document.getElementById("missedFilter").value = state.filters.missed;
    document.getElementById("courtFilter").value = state.filters.court;
    document.getElementById("paymentFilter").value = state.filters.payment;
    document.getElementById("activeFilter").onchange = (event) => { state.filters.active = event.target.value; render(); };
    document.getElementById("bondFilter").onchange = (event) => { state.filters.bond = event.target.value; render(); };
    document.getElementById("missedFilter").onchange = (event) => { state.filters.missed = event.target.value; render(); };
    document.getElementById("courtFilter").onchange = (event) => { state.filters.court = event.target.value; render(); };
    document.getElementById("paymentFilter").onchange = (event) => { state.filters.payment = event.target.value; render(); };
    main.querySelectorAll(".name-link").forEach((button) => button.onclick = () => { state.selectedDefendantId = button.dataset.id; state.tab = "details"; renderSidebar(); render(); });
    return;
  }

  if (state.tab === "details" && selected) {
    const bond = data.bonds.find((item) => item.defendant_id === selected.id);
    const court = data.court_dates.find((item) => item.defendant_id === selected.id);
    const payment = data.payments.find((item) => item.defendant_id === selected.id && item.status !== "paid") || data.payments.find((item) => item.defendant_id === selected.id);
    const checkins = data.check_ins.filter((item) => item.defendant_id === selected.id).sort((a, b) => new Date(b.checked_in_at) - new Date(a.checked_in_at));
    const locs = data.location_logs.filter((item) => item.defendant_id === selected.id).sort((a, b) => new Date(b.captured_at) - new Date(a.captured_at));
    const notes = data.notes.filter((item) => item.defendant_id === selected.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const reminders = data.reminders.filter((item) => item.defendant_id === selected.id);

    main.innerHTML = `<section class="section-stack">
      <article class="card"><p class="eyebrow">Defendant details</p><h2>${selected.full_name}</h2><p class="muted">${selected.email} · ${selected.phone}</p>
      <div class="grid two">
        <div class="item"><strong>Bond status</strong><p>${selected.bond_status}</p></div>
        <div class="item"><strong>Active case</strong><p>${selected.active ? "Yes" : "No"}</p></div>
      </div></article>
      <article class="card"><h3>Case updates</h3>
        <div class="grid two">
          <label>Court date/time<input id="editCourtDate" type="datetime-local" value="${court ? new Date(court.court_datetime).toISOString().slice(0, 16) : ""}" /></label>
          <label>Court address<input id="editCourtAddress" value="${court?.court_address || ""}" /></label>
          <label>Bond status<select id="editBondStatus"><option value="active">Active</option><option value="closed">Closed</option><option value="revoked">Revoked</option></select></label>
          <label>Payment due date<input id="editPayDue" type="date" value="${payment?.due_date || ""}" /></label>
          <label>Payment status<select id="editPayStatus"><option value="due">Due</option><option value="pending">Pending</option><option value="paid">Paid</option><option value="overdue">Overdue</option></select></label>
          <label>Case active<select id="editCaseActive"><option value="true">Active</option><option value="false">Inactive</option></select></label>
          <label>Missed check-in<select id="editMissed"><option value="false">No</option><option value="true">Yes</option></select></label>
          <label>Capture location snapshot<button id="captureLocation" class="btn">Capture current location</button></label>
        </div>
        <button id="saveCaseBtn" class="btn btn-primary" style="margin-top:.7rem;">Save case updates</button>
      </article>
      <article class="card"><h3>Bond and contacts</h3>
        <div class="kv"><span>Bond number</span><strong>${bond?.bond_number || "N/A"}</strong></div>
        <div class="kv"><span>Bond amount</span><strong>$${bond?.bond_amount?.toLocaleString() || 0}</strong></div>
        <div class="kv"><span>Charges</span><strong>${bond?.charges || "N/A"}</strong></div>
        <div class="kv"><span>Indemnitor</span><strong>${bond?.indemnitor_name || "N/A"} · ${bond?.indemnitor_phone || "N/A"}</strong></div>
        <div class="kv"><span>Emergency contact</span><strong>${selected.emergency_contact_name} · ${selected.emergency_contact_phone}</strong></div>
      </article>
      <article class="card"><h3>Check-in history</h3><div class="list">${checkins.map((checkin) => `<div class="item"><div class="kv"><strong>${fmtDate(checkin.checked_in_at)}</strong><span>${checkin.latitude ? `${checkin.latitude}, ${checkin.longitude}` : "Location unavailable"}</span></div><p class="muted">Selfie: ${checkin.selfie_name || "Captured"}</p>${checkin.selfie_data_url ? `<img class="selfie-thumb" src="${checkin.selfie_data_url}" alt="Check-in selfie for ${selected.full_name}" />` : ""}</div>`).join("") || "No check-ins recorded."}</div></article>
      <article class="card"><h3>Location log</h3><div class="list">${locs.map((log) => `<div class="item"><div class="kv"><strong>${fmtDate(log.captured_at)}</strong><span>${log.latitude ?? "N/A"}, ${log.longitude ?? "N/A"}</span></div><p class="muted">${log.source}</p></div>`).join("") || "No location captures recorded."}</div></article>
      <article class="card"><h3>Internal notes</h3>
        <textarea id="noteBody" placeholder="Add confidential case note"></textarea>
        <button id="addNoteBtn" class="btn" style="margin-top:.6rem;">Add note</button>
        <div class="list" style="margin-top:.7rem;">${notes.map((note) => `<div class="item"><p>${note.body}</p><p class="muted">${note.author_name} · ${fmtDate(note.created_at)}</p></div>`).join("")}</div>
      </article>
      <article class="card"><h3>Reminder status</h3>
        <div class="list">${reminders.map((reminder) => `<div class="item"><div class="kv"><strong>${reminder.title}</strong><span>${reminder.status}</span></div><p>${reminder.message}</p><button class="btn toggle-reminder" data-id="${reminder.id}">${reminder.acknowledged ? "Mark unacknowledged" : "Mark acknowledged"}</button><button class="btn toggle-sent" data-id="${reminder.id}">${reminder.status === "sent" ? "Mark pending" : "Mark sent"}</button></div>`).join("")}</div>
      </article>
    </section>`;
    document.getElementById("editBondStatus").value = selected.bond_status;
    document.getElementById("editPayStatus").value = payment?.status || "due";
    document.getElementById("editCaseActive").value = String(selected.active);
    document.getElementById("editMissed").value = String(selected.missed_check_in);
    document.getElementById("saveCaseBtn").onclick = () => {
      const previousPaymentStatus = payment?.status;
      if (court) {
        court.court_datetime = new Date(document.getElementById("editCourtDate").value).toISOString();
        court.court_address = document.getElementById("editCourtAddress").value;
      }
      if (bond) bond.status = document.getElementById("editBondStatus").value;
      selected.bond_status = document.getElementById("editBondStatus").value;
      selected.active = document.getElementById("editCaseActive").value === "true";
      selected.missed_check_in = document.getElementById("editMissed").value === "true";
      if (payment) {
        payment.due_date = document.getElementById("editPayDue").value;
        payment.status = document.getElementById("editPayStatus").value;
      }
      if (payment && previousPaymentStatus !== "paid" && payment.status === "paid") {
        markActivity(`Payment marked paid for ${selected.full_name}.`, {
          type: "payment",
          defendant_id: selected.id,
          payment_amount: payment.amount_due
        });
      } else {
        markActivity(`Case updated for ${selected.full_name}.`, { defendant_id: selected.id });
      }
      api.saveData(data);
      render();
    };
    document.getElementById("addNoteBtn").onclick = () => {
      const body = document.getElementById("noteBody").value.trim();
      if (!body) return;
      data.notes.unshift({ id: `note-${Date.now()}`, agency_id: agency.id, defendant_id: selected.id, author_name: "Staff", body, created_at: new Date().toISOString() });
      markActivity(`New staff note added for ${selected.full_name}.`, { type: "note", defendant_id: selected.id });
      api.saveData(data);
      render();
    };
    document.getElementById("captureLocation").onclick = () => {
      if (!navigator.geolocation) {
        markActivity(`Location capture unavailable for ${selected.full_name}: geolocation not supported.`);
        render();
        return;
      }
      navigator.geolocation.getCurrentPosition((position) => {
        const latitude = +position.coords.latitude.toFixed(6);
        const longitude = +position.coords.longitude.toFixed(6);
        data.location_logs.unshift({ id: `loc-${Date.now()}`, agency_id: agency.id, defendant_id: selected.id, check_in_id: null, captured_at: new Date().toISOString(), latitude, longitude, source: "admin_capture" });
        markActivity(`Admin captured location for ${selected.full_name}.`, {
          type: "location_capture",
          defendant_id: selected.id,
          location: { latitude, longitude }
        });
        api.saveData(data);
        render();
      }, () => {
        markActivity(`Admin location capture failed for ${selected.full_name}.`, { defendant_id: selected.id });
        render();
      });
    };
    main.querySelectorAll(".toggle-reminder").forEach((button) => button.onclick = () => {
      const reminder = data.reminders.find((item) => item.id === button.dataset.id);
      reminder.acknowledged = !reminder.acknowledged;
      markActivity(`Reminder acknowledgment updated for ${selected.full_name}.`, { defendant_id: selected.id });
      api.saveData(data);
      render();
    });
    main.querySelectorAll(".toggle-sent").forEach((button) => button.onclick = () => {
      const reminder = data.reminders.find((item) => item.id === button.dataset.id);
      reminder.status = reminder.status === "sent" ? "pending" : "sent";
      markActivity(`Reminder status updated for ${selected.full_name}.`, { defendant_id: selected.id });
      api.saveData(data);
      render();
    });
    return;
  }

  if (state.tab === "reminders") {
    const target = data.defendants.find((defendant) => defendant.id === state.selectedDefendantId) || data.defendants[0];
    const list = data.reminders.filter((reminder) => reminder.defendant_id === target.id);
    main.innerHTML = `<section class="card"><h2>Reminder center</h2><p class="muted">Create and track communication touchpoints clearly.</p>
      <label>Defendant<select id="remDef">${data.defendants.map((defendant) => `<option value="${defendant.id}">${defendant.full_name}</option>`).join("")}</select></label>
      <div class="grid two" style="margin-top:.5rem;"><input id="remTitle" placeholder="Reminder title" /><input id="remType" placeholder="Type (court, payment, check-in)" /></div>
      <textarea id="remMessage" placeholder="Reminder message"></textarea>
      <button id="createReminder" class="btn btn-primary" style="margin-top:.6rem;">Create reminder</button>
      <div class="list" style="margin-top:.7rem;">${list.map((reminder) => `<div class="item"><div class="kv"><strong>${reminder.title}</strong><span>${reminder.status}</span></div><p>${reminder.message}</p><p class="muted">${fmtDate(reminder.scheduled_for)} · ${reminder.acknowledged ? "Acknowledged" : "Unacknowledged"}</p></div>`).join("")}</div></section>`;
    document.getElementById("remDef").value = target.id;
    document.getElementById("remDef").onchange = (event) => { state.selectedDefendantId = event.target.value; render(); };
    document.getElementById("createReminder").onclick = () => {
      const defendantId = document.getElementById("remDef").value;
      const title = document.getElementById("remTitle").value.trim();
      const type = document.getElementById("remType").value.trim() || "general";
      const message = document.getElementById("remMessage").value.trim();
      if (!title || !message) return;
      data.reminders.unshift({ id: `rem-${Date.now()}`, agency_id: agency.id, defendant_id: defendantId, type, title, message, scheduled_for: new Date().toISOString(), status: "pending", acknowledged: false });
      const defendant = data.defendants.find((item) => item.id === defendantId);
      markActivity(`Reminder created for ${defendant.full_name}.`, { type: "reminder", defendant_id: defendantId });
      api.saveData(data);
      render();
    };
    return;
  }

  if (state.tab === "activity") {
    main.innerHTML = `<section class="card"><h2>Activity log</h2><p class="muted">Recent system and staff updates for accountability.</p><div class="list" id="activityLogList">${renderActivityFeed(data.activity, data)}</div></section>`;
  }
}

(async function init() {
  renderShell();
  state.data = await api.getAllData();
  renderSidebar();
  render();
})();
