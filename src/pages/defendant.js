import { applyAgencyDocumentBranding } from "../components/documentBranding.js";
import { renderBrandMark } from "../components/brand.js";
import { api } from "../lib/api.js";
import { getAgencyConfig } from "../lib/agency.js";
import { badge, fmtDate, fmtShortDate, phoneHref, smsHref } from "../lib/format.js";
import { getSession } from "../lib/session.js";

const session = getSession();
if (!session || session.role !== "defendant") window.location.href = "/login.html";

const agency = getAgencyConfig();
applyAgencyDocumentBranding(agency, "Defendant Portal");

const navItems = [["dashboard", "Home"], ["checkin", "Check In"], ["court", "Court"], ["payments", "Payments"], ["reminders", "Reminders"], ["contact", "Contact"], ["profile", "Profile"]];
const state = {
  active: "dashboard",
  data: null,
  defendant: null,
  checkInFeedback: { message: "", isError: false },
  cameraStream: null,
  cameraReady: false,
  checkInDraft: { selfieDataUrl: "", selfieName: "", capturedAt: null }
};

const app = document.getElementById("app");

function renderShell() {
  app.innerHTML = `<header class="topbar">
    <div class="brand-pair">
      ${renderBrandMark(agency, true)}
      <div>
        <p class="eyebrow">${agency.companyName}</p>
        <h1>Defendant Portal</h1>
      </div>
    </div>
    <button id="logoutBtn" class="btn btn-outline">Logout</button>
  </header>
  <main id="defendantMain" class="main-content"></main>
  <nav class="bottom-nav" id="defNav"></nav>`;
  document.getElementById("logoutBtn").addEventListener("click", () => { api.logout(); window.location.href = "/login.html"; });
}

function renderNav() {
  const nav = document.getElementById("defNav");
  nav.innerHTML = navItems.map(([key, label]) => `<button data-key="${key}" class="${state.active === key ? "active" : ""}">${label}</button>`).join("");
  nav.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
    if (state.active === "checkin" && button.dataset.key !== "checkin") {
      stopCamera();
      resetCheckInDraft();
    }
    state.active = button.dataset.key;
    render();
    renderNav();
  }));
}

function getD() {
  const d = state.defendant;
  const data = state.data;
  return {
    d,
    bond: data.bonds.find((item) => item.defendant_id === d.id),
    court: data.court_dates.filter((item) => item.defendant_id === d.id).sort((a, b) => new Date(a.court_datetime) - new Date(b.court_datetime))[0],
    payments: data.payments.filter((item) => item.defendant_id === d.id).sort((a, b) => new Date(b.due_date) - new Date(a.due_date)),
    checkins: data.check_ins.filter((item) => item.defendant_id === d.id).sort((a, b) => new Date(b.checked_in_at) - new Date(a.checked_in_at)),
    reminders: data.reminders.filter((item) => item.defendant_id === d.id).sort((a, b) => new Date(b.scheduled_for) - new Date(a.scheduled_for))
  };
}

function setCheckInStatus(message, isError = false) {
  state.checkInFeedback = { message, isError };
  const info = document.getElementById("checkinStatus");
  if (!info) return;
  info.textContent = message;
  info.style.color = isError ? "var(--brand-error)" : "";
}

function stopCamera() {
  if (state.cameraStream) {
    state.cameraStream.getTracks().forEach((track) => track.stop());
    state.cameraStream = null;
  }
  state.cameraReady = false;
}

function updateSelfiePreview() {
  const preview = document.getElementById("selfiePreview");
  const previewWrap = document.getElementById("selfiePreviewWrap");
  if (!preview || !previewWrap) return;

  if (!state.checkInDraft.selfieDataUrl) {
    preview.removeAttribute("src");
    preview.alt = "";
    previewWrap.hidden = true;
    return;
  }

  preview.src = state.checkInDraft.selfieDataUrl;
  preview.alt = "Live selfie captured for check-in";
  previewWrap.hidden = false;
}

function resetCheckInDraft() {
  state.checkInDraft = { selfieDataUrl: "", selfieName: "", capturedAt: null };
  state.cameraReady = false;
  updateSelfiePreview();
}

async function startCamera(autoStarted = false) {
  const video = document.getElementById("selfieCamera");
  const status = document.getElementById("cameraHelp");
  const captureBtn = document.getElementById("captureSelfieBtn");
  if (!video || !status || !captureBtn) return;

  if (!navigator.mediaDevices?.getUserMedia || !agency.features.enableLiveCheckInCamera) {
    state.cameraReady = false;
    status.textContent = agency.checkInRules.cameraPermissionMessage;
    captureBtn.disabled = true;
    return;
  }

  stopCamera();
  captureBtn.disabled = true;
  status.textContent = autoStarted ? "Opening your front camera..." : "Opening camera...";

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "user" },
        width: { ideal: 1080 },
        height: { ideal: 1440 }
      },
      audio: false
    });
    state.cameraStream = stream;
    video.srcObject = stream;
    await video.play();
    state.cameraReady = true;
    captureBtn.disabled = false;
    status.textContent = "Center your face in frame, then tap Take Selfie.";
    setCheckInStatus("");
  } catch {
    state.cameraReady = false;
    status.textContent = autoStarted ? "Your browser blocked automatic camera launch. Tap Open Camera to continue." : "We couldn't access the camera. Please allow camera access and try again.";
    captureBtn.disabled = true;
  }
}

function captureSelfie() {
  const video = document.getElementById("selfieCamera");
  const canvas = document.getElementById("selfieCanvas");
  const status = document.getElementById("cameraHelp");
  const retakeBtn = document.getElementById("retakeSelfieBtn");
  if (!video || !canvas || !state.cameraReady || !state.cameraStream) {
    setCheckInStatus(agency.checkInRules.validationMessage, true);
    return;
  }

  const width = video.videoWidth || 720;
  const height = video.videoHeight || 960;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, width, height);

  const capturedAt = Date.now();
  state.checkInDraft = {
    selfieDataUrl: canvas.toDataURL("image/jpeg", 0.92),
    selfieName: `live-selfie-${capturedAt}.jpg`,
    capturedAt
  };
  updateSelfiePreview();
  stopCamera();
  if (retakeBtn) retakeBtn.hidden = false;
  status.textContent = "Live selfie captured. If needed, you can retake it before submitting.";
  setCheckInStatus("");
}

async function handleCheckIn() {
  const form = document.getElementById("checkInForm");
  const submitBtn = document.getElementById("checkInBtn");

  if (!state.checkInDraft.selfieDataUrl || !state.checkInDraft.capturedAt) {
    setCheckInStatus(agency.checkInRules.validationMessage, true);
    return;
  }

  submitBtn.disabled = true;
  form?.setAttribute("aria-busy", "true");
  setCheckInStatus("Checking you in now and securing your location confirmation...");

  let latitude = null;
  let longitude = null;
  let locationNote = "";

  if (navigator.geolocation) {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
      });
      latitude = +position.coords.latitude.toFixed(6);
      longitude = +position.coords.longitude.toFixed(6);
    } catch {
      locationNote = " Location permission was unavailable.";
    }
  } else {
    locationNote = " This device cannot share location.";
  }

  try {
    const result = await api.submitCheckIn({
      defendantId: state.defendant.id,
      defendantName: state.defendant.full_name,
      source: "mobile",
      latitude,
      longitude,
      selfieName: state.checkInDraft.selfieName,
      selfieDataUrl: state.checkInDraft.selfieDataUrl
    });

    state.data.check_ins.unshift(result.entry);
    state.data.location_logs.unshift(result.locationLog);
    state.data.activity.unshift({ agency_id: agency.id, at: result.entry.checked_in_at, text: `${state.defendant.full_name} check-in completed from defendant portal.` });
    setCheckInStatus(`Check-in confirmed at ${fmtDate(result.entry.checked_in_at)}.${locationNote} Thank you for staying on track.`);
    resetCheckInDraft();
    render();
  } catch (error) {
    setCheckInStatus(error.message || "We could not complete your check-in. Please try again.", true);
  } finally {
    submitBtn.disabled = false;
    form?.removeAttribute("aria-busy");
  }
}

function render() {
  if (state.active !== "checkin") stopCamera();
  const main = document.getElementById("defendantMain");
  const { d, bond, court, payments, checkins, reminders } = getD();
  const nextPay = payments.find((payment) => payment.status !== "paid") || payments[0];

  if (state.active === "dashboard") {
    main.innerHTML = `<section class="section-stack">
      <article class="card">
        <p class="eyebrow">Welcome back, ${d.full_name}</p>
        <h2>Your next court date</h2>
        <div class="metric" style="margin-top:.4rem;">
          <p class="value">${fmtDate(court.court_datetime)}</p>
          <p class="muted">${court.court_address}</p>
        </div>
        <div class="help-strip">
          <strong>Need help fast?</strong>
          <p class="muted">Need to reach your bail team? We respond quickly, day or night.</p>
        </div>
      </article>
      <article class="card grid two">
        <div class="metric"><p>Check-in status</p><p class="value">${badge(checkins[0]?.status || "pending")}</p></div>
        <div class="metric"><p>Payment due</p><p class="value">${nextPay ? fmtShortDate(nextPay.due_date) : "No due date"}</p></div>
        <div class="metric"><p>Bond status</p><p class="value">${badge(bond.status)}</p></div>
        <div class="metric"><p>Bond number</p><p class="value">${bond.bond_number}</p></div>
      </article>
      <article class="card grid three">
        <button class="btn btn-primary" data-go="checkin">Check in now</button>
        <button class="btn" data-go="payments">View payment reminder</button>
        <button class="btn" data-go="contact">Need to reach your bail team?</button>
      </article>
    </section>`;
    main.querySelectorAll("button[data-go]").forEach((button) => button.onclick = () => {
      if (state.active === "checkin" && button.dataset.go !== "checkin") {
        stopCamera();
        resetCheckInDraft();
      }
      state.active = button.dataset.go;
      render();
      renderNav();
    });
    return;
  }

  if (state.active === "checkin") {
    main.innerHTML = `<section class="section-stack"><article class="card">
      <h2>Stay on track with your check-in</h2><p class="muted">Use your front camera to take a live selfie, then submit your required check-in. We record the time automatically.</p>
      <form id="checkInForm" class="section-stack" novalidate>
        <div class="camera-panel">
          <div class="camera-frame">
            <video id="selfieCamera" class="selfie-camera" autoplay playsinline muted></video>
          </div>
          <canvas id="selfieCanvas" hidden></canvas>
          <p id="cameraHelp" class="muted">Opening your front camera...</p>
          <div class="grid two">
            <button id="openCameraBtn" type="button" class="btn">Open Camera</button>
            <button id="captureSelfieBtn" type="button" class="btn btn-primary">Take Selfie</button>
          </div>
        </div>
        <p class="muted">${agency.checkInRules.validationMessage}</p>
        <div id="selfiePreviewWrap" class="selfie-preview-wrap" hidden>
          <img id="selfiePreview" class="selfie-preview" alt="" />
        </div>
        <button id="retakeSelfieBtn" type="button" class="btn btn-outline"${state.checkInDraft.selfieDataUrl ? "" : " hidden"}>Retake Selfie</button>
        <button id="checkInBtn" type="submit" class="btn btn-primary" style="width:100%;font-size:1.12rem;">Check in now</button>
      </form>
      <p id="checkinStatus" class="status" aria-live="polite">${state.checkInFeedback.message}</p></article>
      <article class="card"><h3>Recent check-ins</h3><div class="list">${checkins.slice(0, 8).map((checkin) => `<div class="item"><div class="kv"><span>${fmtDate(checkin.checked_in_at)}</span>${badge(checkin.status)}</div><p class="muted">${checkin.latitude ? `Lat ${checkin.latitude}, Lng ${checkin.longitude}` : "Location unavailable"}</p><p class="muted">Selfie: ${checkin.selfie_name || "Captured"}</p></div>`).join("")}</div></article>
    </section>`;
    if (state.checkInFeedback.isError) document.getElementById("checkinStatus").style.color = "var(--brand-error)";
    document.getElementById("checkInForm").onsubmit = (event) => { event.preventDefault(); handleCheckIn(); };
    document.getElementById("openCameraBtn").onclick = () => startCamera(false);
    document.getElementById("captureSelfieBtn").onclick = captureSelfie;
    document.getElementById("retakeSelfieBtn").onclick = async () => {
      resetCheckInDraft();
      document.getElementById("retakeSelfieBtn").hidden = true;
      await startCamera(false);
    };
    updateSelfiePreview();
    if (state.checkInDraft.selfieDataUrl) {
      document.getElementById("cameraHelp").textContent = "Live selfie captured. If needed, you can retake it before submitting.";
    } else {
      startCamera(true).then(() => {
        const retakeButton = document.getElementById("retakeSelfieBtn");
        if (retakeButton) retakeButton.hidden = !state.checkInDraft.selfieDataUrl;
      });
    }
    document.getElementById("retakeSelfieBtn").hidden = !state.checkInDraft.selfieDataUrl;
    return;
  }

  if (state.active === "court") {
    main.innerHTML = `<section class="section-stack"><article class="card"><h2>Your court and bond information</h2>
    <div class="kv"><span>Bond number</span><strong>${bond.bond_number}</strong></div>
    <div class="kv"><span>Charges</span><strong>${bond.charges}</strong></div>
    <div class="kv"><span>Court date/time</span><strong>${fmtDate(court.court_datetime)}</strong></div>
    <div class="kv"><span>Court address</span><strong>${court.court_address}</strong></div>
    <div class="kv"><span>Bond conditions</span><strong>${bond.conditions}</strong></div>
    <div class="kv"><span>Indemnitor</span><strong>${bond.indemnitor_name} · ${bond.indemnitor_phone}</strong></div>
    <div class="kv"><span>Assigned bail agent</span><strong>${d.bail_agent_name}</strong></div>
    <div class="kv"><span>Company contact</span><strong>${agency.companyName} · ${agency.contact.supportPhone}</strong></div></article></section>`;
    return;
  }

  if (state.active === "payments") {
    main.innerHTML = `<section class="section-stack"><article class="card"><h2>Payment status</h2>
    ${nextPay ? `<div class="kv"><span>Amount due</span><strong>$${nextPay.amount_due.toLocaleString()}</strong></div><div class="kv"><span>Due date</span><strong>${fmtShortDate(nextPay.due_date)}</strong></div><div class="kv"><span>Status</span><strong>${badge(nextPay.status)}</strong></div>` : ""}
    <p class="muted">If payment support is needed, contact your bail agent as soon as possible.</p>
    <button class="btn btn-primary" style="width:100%;margin-top:.6rem;">Pay now</button></article>
    <article class="card"><h3>Payment history</h3><div class="list">${payments.map((payment) => `<div class="item"><div class="kv"><strong>$${payment.amount_due.toLocaleString()}</strong>${badge(payment.status)}</div><p class="muted">Due ${fmtShortDate(payment.due_date)}${payment.paid_at ? ` · Paid ${fmtDate(payment.paid_at)}` : ""}</p></div>`).join("")}</div></article></section>`;
    return;
  }

  if (state.active === "reminders") {
    main.innerHTML = `<section class="section-stack"><article class="card"><h2>Reminders</h2>
    <p class="muted">Clear reminders to help you stay on track and prepared.</p>
    <div class="list">
    ${d.missed_check_in ? `<div class="item"><div class="kv"><strong>Missed check-in notice</strong>${badge("attention")}</div><p class="muted">Please contact your bail agent now so we can help resolve this quickly.</p></div>` : ""}
    ${reminders.map((reminder) => `<div class="item"><div class="kv"><strong>${reminder.title}</strong>${badge(reminder.status)}</div><p>${reminder.message}</p><p class="muted">Scheduled ${fmtDate(reminder.scheduled_for)}</p></div>`).join("")}
    </div></article></section>`;
    return;
  }

  if (state.active === "contact") {
    main.innerHTML = `<section class="section-stack"><article class="card"><h2>Need to reach your bail team?</h2>
    <p class="muted">${agency.reassuranceText}</p>
    <div class="notice"><strong>Primary office hours:</strong> <span>${agency.contact.officeHours}</span></div>
    <p class="muted" style="margin-top:.6rem;">${agency.contact.officeAddress}</p>
    <div class="grid two" style="margin-top:.7rem;">
      <a class="btn btn-primary" href="${phoneHref(agency.contact.supportPhone)}">Call office</a>
      <a class="btn" href="${smsHref(agency.contact.supportSms)}">Text office</a>
      <a class="btn" href="mailto:${agency.supportEmailOverride || agency.contact.supportEmail}">Email office</a>
      <a class="btn" href="${phoneHref(agency.contact.emergencyPhone)}">After-hours line</a>
    </div></article></section>`;
    return;
  }

  if (state.active === "profile") {
    main.innerHTML = `<section class="section-stack"><article class="card"><h2>Profile & communication settings</h2>
    <div class="kv"><span>Full name</span><strong>${d.full_name}</strong></div>
    <div class="kv"><span>Date of birth</span><strong>${fmtShortDate(d.dob)}</strong></div>
    <div class="kv"><span>Phone</span><strong>${d.phone}</strong></div>
    <div class="kv"><span>Email</span><strong>${d.email}</strong></div>
    <div class="kv"><span>Emergency contact</span><strong>${d.emergency_contact_name} · ${d.emergency_contact_phone}</strong></div>
    <h3 style="margin-top:.8rem;">Reminder preferences</h3>
    <div class="item"><label><input type="checkbox" checked /> SMS reminders</label></div>
    <div class="item"><label><input type="checkbox" checked /> Email reminders</label></div>
    <div class="item"><label><input type="checkbox" /> Voice call reminders</label></div>
    <p class="muted" style="margin-top:.6rem;">Update requests can be completed by your bail agent at any time.</p>
    </article></section>`;
  }
}

(async function init() {
  renderShell();
  const data = await api.getAllData();
  state.data = data;
  const defendantId = session.defendantId || data.users.find((user) => user.id === session.userId)?.defendant_id;
  state.defendant = data.defendants.find((defendant) => defendant.id === defendantId);
  if (!state.defendant) {
    api.logout();
    window.location.href = "/login.html";
    return;
  }
  renderNav();
  render();
  window.addEventListener("beforeunload", stopCamera);
})();
