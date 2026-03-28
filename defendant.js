(function () {
  const session = JSON.parse(localStorage.getItem("angelic_session") || "null");
  if (!session || session.role !== "defendant") window.location.href = "login.html";

  const brand = window.Branding.get();
  const navItems = [
    ["dashboard", "Home"], ["checkin", "Check In"], ["court", "Court"],
    ["payments", "Payments"], ["reminders", "Reminders"], ["contact", "Contact"], ["profile", "Profile"]
  ];
  const state = { active: "dashboard", data: null, defendant: null };

  const main = document.getElementById("defendantMain");
  const nav = document.getElementById("defNav");
  document.getElementById("logoutBtn").addEventListener("click", () => { window.AngelicAPI.logout(); window.location.href = "login.html"; });

  function fmtDate(value) { return new Date(value).toLocaleString(); }
  function badge(status) {
    const type = /paid|received|active|sent|scheduled/.test(status) ? "ok" : /due|pending|attention/.test(status) ? "warn" : "danger";
    return `<span class="badge ${type}">${status}</span>`;
  }

  function renderNav() {
    nav.innerHTML = navItems.map(([key, label]) => `<button data-key="${key}" class="${state.active === key ? "active" : ""}">${label}</button>`).join("");
    nav.querySelectorAll("button").forEach((btn) => btn.addEventListener("click", () => { state.active = btn.dataset.key; render(); renderNav(); }));
  }

  function getD() {
    const d = state.defendant;
    const data = state.data;
    return {
      d,
      bond: data.bonds.find((b) => b.defendant_id === d.id),
      court: data.court_dates.filter((c) => c.defendant_id === d.id).sort((a,b)=>new Date(a.court_datetime)-new Date(b.court_datetime))[0],
      payments: data.payments.filter((p) => p.defendant_id === d.id).sort((a,b)=>new Date(b.due_date)-new Date(a.due_date)),
      checkins: data.check_ins.filter((c) => c.defendant_id === d.id).sort((a,b)=>new Date(b.checked_in_at)-new Date(a.checked_in_at)),
      reminders: data.reminders.filter((r) => r.defendant_id === d.id).sort((a,b)=>new Date(b.scheduled_for)-new Date(a.scheduled_for)),
    };
  }

  async function handleCheckIn() {
    const info = document.getElementById("checkinStatus");
    info.textContent = "Checking in now and securing your location confirmation...";
    const now = new Date().toISOString();
    const data = state.data;
    const entry = { id: `ci-${Date.now()}`, defendant_id: state.defendant.id, checked_in_at: now, source: "mobile", status: "received", latitude: null, longitude: null };

    const save = () => {
      data.check_ins.push(entry);
      data.location_logs.push({ id: `loc-${Date.now()}`, defendant_id: state.defendant.id, check_in_id: entry.id, captured_at: now, latitude: entry.latitude, longitude: entry.longitude, source: "check_in" });
      data.activity.unshift({ at: now, text: `${state.defendant.full_name} check-in completed from defendant portal.` });
      window.AngelicAPI.saveData(data);
      info.textContent = `Check-in confirmed at ${fmtDate(now)}. Thank you for staying on track.`;
      render();
    };

    if (!navigator.geolocation) {
      info.textContent = "Check-in confirmed. This device cannot share location.";
      save();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        entry.latitude = +pos.coords.latitude.toFixed(6);
        entry.longitude = +pos.coords.longitude.toFixed(6);
        save();
      },
      () => {
        info.textContent = "Check-in confirmed. Location permission was unavailable.";
        save();
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function render() {
    const { d, bond, court, payments, checkins, reminders } = getD();
    const nextPay = payments.find((p) => p.status !== "paid") || payments[0];

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
          <div class="metric"><p>Payment due</p><p class="value">${nextPay ? new Date(nextPay.due_date).toLocaleDateString() : "No due date"}</p></div>
          <div class="metric"><p>Bond status</p><p class="value">${badge(bond.status)}</p></div>
          <div class="metric"><p>Bond number</p><p class="value">${bond.bond_number}</p></div>
        </article>

        <article class="card grid three">
          <button class="btn btn-primary" data-go="checkin">Check in now</button>
          <button class="btn" data-go="payments">View payment reminder</button>
          <button class="btn" data-go="contact">Need to reach your bail team?</button>
        </article>
      </section>`;
      main.querySelectorAll("button[data-go]").forEach((b)=>b.onclick=()=>{state.active=b.dataset.go; render(); renderNav();});
      return;
    }

    if (state.active === "checkin") {
      main.innerHTML = `<section class="section-stack"><article class="card">
        <h2>Stay on track with your check-in</h2><p class="muted">Tap below to submit your required check-in. We record the time automatically.</p>
        <button id="checkInBtn" class="btn btn-primary" style="width:100%;font-size:1.12rem;margin-top:.8rem;">Check in now</button>
        <p id="checkinStatus" class="status"></p></article>
        <article class="card"><h3>Recent check-ins</h3><div class="list">${checkins.slice(0, 8).map((c)=>`<div class="item"><div class="kv"><span>${fmtDate(c.checked_in_at)}</span>${badge(c.status)}</div><p class="muted">${c.latitude ? `Lat ${c.latitude}, Lng ${c.longitude}` : "Location unavailable"}</p></div>`).join("")}</div></article>
      </section>`;
      document.getElementById("checkInBtn").onclick = handleCheckIn;
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
      <div class="kv"><span>Company contact</span><strong>${brand.companyName} · ${brand.supportPhone}</strong></div></article></section>`;
      return;
    }

    if (state.active === "payments") {
      main.innerHTML = `<section class="section-stack"><article class="card"><h2>Payment status</h2>
      ${nextPay ? `<div class="kv"><span>Amount due</span><strong>$${nextPay.amount_due.toLocaleString()}</strong></div><div class="kv"><span>Due date</span><strong>${new Date(nextPay.due_date).toLocaleDateString()}</strong></div><div class="kv"><span>Status</span><strong>${badge(nextPay.status)}</strong></div>` : ""}
      <p class="muted">If payment support is needed, contact your bail agent as soon as possible.</p>
      <button class="btn btn-primary" style="width:100%;margin-top:.6rem;">Pay now</button></article>
      <article class="card"><h3>Payment history</h3><div class="list">${payments.map((p)=>`<div class="item"><div class="kv"><strong>$${p.amount_due.toLocaleString()}</strong>${badge(p.status)}</div><p class="muted">Due ${new Date(p.due_date).toLocaleDateString()}${p.paid_at ? ` · Paid ${fmtDate(p.paid_at)}` : ""}</p></div>`).join("")}</div></article></section>`;
      return;
    }

    if (state.active === "reminders") {
      const missed = d.missed_check_in;
      main.innerHTML = `<section class="section-stack"><article class="card"><h2>Reminders</h2>
      <p class="muted">Clear reminders to help you stay on track and prepared.</p>
      <div class="list">
      ${missed ? `<div class="item"><div class="kv"><strong>Missed check-in notice</strong>${badge("attention")}</div><p class="muted">Please contact your bail agent now so we can help resolve this quickly.</p></div>` : ""}
      ${reminders.map((r)=>`<div class="item"><div class="kv"><strong>${r.title}</strong>${badge(r.status)}</div><p>${r.message}</p><p class="muted">Scheduled ${fmtDate(r.scheduled_for)}</p></div>`).join("")}
      </div></article></section>`;
      return;
    }

    if (state.active === "contact") {
      main.innerHTML = `<section class="section-stack"><article class="card"><h2>Need to reach your bail team?</h2>
      <p class="muted" data-brand="reassuranceText">${brand.reassuranceText}</p>
      <div class="notice"><strong>Primary office hours:</strong> <span data-brand="officeHours">${brand.officeHours}</span></div>
      <p class="muted" style="margin-top:.6rem;" data-brand="officeAddress">${brand.officeAddress}</p>
      <div class="grid two" style="margin-top:.7rem;">
        <a class="btn btn-primary" href="${window.Branding.phoneHref(brand.supportPhone)}">Call office</a>
        <a class="btn" href="${window.Branding.smsHref(brand.supportSms)}">Text office</a>
        <a class="btn" href="mailto:${brand.supportEmail}">Email office</a>
        <a class="btn" href="${window.Branding.phoneHref(brand.emergencyPhone)}">After-hours line</a>
      </div></article></section>`;
      window.Branding.hydrateBrandFields(main);
      return;
    }

    if (state.active === "profile") {
      main.innerHTML = `<section class="section-stack"><article class="card"><h2>Profile & communication settings</h2>
      <div class="kv"><span>Full name</span><strong>${d.full_name}</strong></div>
      <div class="kv"><span>Date of birth</span><strong>${new Date(d.dob).toLocaleDateString()}</strong></div>
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
    const data = await window.AngelicAPI.getAllData();
    state.data = data;
    const defendantId = session.defendantId || data.users.find((u) => u.id === session.userId)?.defendant_id;
    state.defendant = data.defendants.find((d) => d.id === defendantId);
    if (!state.defendant) { window.AngelicAPI.logout(); window.location.href = "login.html"; return; }
    renderNav();
    render();
  })();
})();
