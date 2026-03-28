(function () {
  const session = JSON.parse(localStorage.getItem("angelic_session") || "null");
  if (!session || session.role !== "defendant") window.location.href = "login.html";

  const navItems = [
    ["dashboard", "Dashboard"], ["checkin", "Check-In"], ["court", "Court/Bond"],
    ["payments", "Payments"], ["reminders", "Reminders"], ["contact", "Contact"], ["profile", "Profile"]
  ];
  const state = { active: "dashboard", data: null, defendant: null };

  const main = document.getElementById("defendantMain");
  const nav = document.getElementById("defNav");
  document.getElementById("logoutBtn").addEventListener("click", () => { window.AngelicAPI.logout(); window.location.href = "login.html"; });

  function fmtDate(value) { return new Date(value).toLocaleString(); }
  function badge(status) {
    const type = /paid|received|active|sent/.test(status) ? "ok" : /due|pending/.test(status) ? "warn" : "danger";
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
      notes: data.notes.filter((n) => n.defendant_id === d.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)),
    };
  }

  async function handleCheckIn() {
    const info = document.getElementById("checkinStatus");
    info.textContent = "Capturing location and logging check-in...";
    const now = new Date().toISOString();
    const data = state.data;
    const entry = { id: `ci-${Date.now()}`, defendant_id: state.defendant.id, checked_in_at: now, source: "mobile", status: "received", latitude: null, longitude: null };

    const save = () => {
      data.check_ins.push(entry);
      data.location_logs.push({ id: `loc-${Date.now()}`, defendant_id: state.defendant.id, check_in_id: entry.id, captured_at: now, latitude: entry.latitude, longitude: entry.longitude, source: "check_in" });
      data.activity.unshift({ at: now, text: `${state.defendant.full_name} check-in completed from defendant portal.` });
      window.AngelicAPI.saveData(data);
      info.textContent = `Check-in recorded at ${fmtDate(now)}.`;
      render();
    };

    if (!navigator.geolocation) {
      info.textContent = "Check-in recorded. Location unavailable on this device.";
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
        info.textContent = "Check-in recorded. Location permission denied or unavailable.";
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
        <article class="card"><h2>${d.full_name}</h2><p class="muted">Bond #${bond.bond_number}</p>
          <div class="grid two">
            <div class="metric"><p>Bond Amount</p><p class="value">$${bond.bond_amount.toLocaleString()}</p></div>
            <div class="metric"><p>Bond Status</p><p class="value">${badge(bond.status)}</p></div>
            <div class="metric"><p>Next Court</p><p class="value">${fmtDate(court.court_datetime)}</p></div>
            <div class="metric"><p>Payment Due</p><p class="value">${nextPay ? new Date(nextPay.due_date).toLocaleDateString() : "N/A"}</p></div>
          </div>
        </article>
        <article class="card"><h3>Case Snapshot</h3>
          <div class="kv"><span>Court Location</span><strong>${court.court_address}</strong></div>
          <div class="kv"><span>Payment Status</span><strong>${badge(nextPay?.status || "none")}</strong></div>
          <div class="kv"><span>Bail Agent</span><strong>${d.bail_agent_name}</strong></div>
          <div class="kv"><span>Office Contact</span><strong>(702) 555-0100</strong></div>
        </article>
        <article class="card grid three">
          <button class="btn btn-primary" data-go="checkin">Check In</button>
          <button class="btn" data-go="payments">Payments</button>
          <button class="btn" data-go="contact">Contact Office</button>
        </article>
      </section>`;
      main.querySelectorAll("button[data-go]").forEach((b)=>b.onclick=()=>{state.active=b.dataset.go; render(); renderNav();});
      return;
    }

    if (state.active === "checkin") {
      main.innerHTML = `<section class="section-stack"><article class="card">
        <h2>Weekly Check-In</h2><p class="muted">Confirm your status and location for compliance records.</p>
        <button id="checkInBtn" class="btn btn-primary" style="width:100%;font-size:1.15rem;margin-top:.8rem;">Check In</button>
        <p id="checkinStatus" class="status"></p></article>
        <article class="card"><h3>Recent Check-Ins</h3><div class="list">${checkins.slice(0, 8).map((c)=>`<div class="item"><div class="kv"><span>${fmtDate(c.checked_in_at)}</span>${badge(c.status)}</div><p class="muted">${c.latitude ? `Lat ${c.latitude}, Lng ${c.longitude}` : "Location unavailable"}</p></div>`).join("")}</div></article>
      </section>`;
      document.getElementById("checkInBtn").onclick = handleCheckIn;
      return;
    }

    if (state.active === "court") {
      main.innerHTML = `<section class="section-stack"><article class="card"><h2>Court & Bond Details</h2>
      <div class="kv"><span>Bond Number</span><strong>${bond.bond_number}</strong></div>
      <div class="kv"><span>Charges</span><strong>${bond.charges}</strong></div>
      <div class="kv"><span>Court Date/Time</span><strong>${fmtDate(court.court_datetime)}</strong></div>
      <div class="kv"><span>Court Address</span><strong>${court.court_address}</strong></div>
      <div class="kv"><span>Bond Conditions</span><strong>${bond.conditions}</strong></div>
      <div class="kv"><span>Indemnitor</span><strong>${bond.indemnitor_name} · ${bond.indemnitor_phone}</strong></div>
      <div class="kv"><span>Assigned Agent</span><strong>${d.bail_agent_name}</strong></div>
      <div class="kv"><span>Company Contact</span><strong>${bond.company_name} · ${bond.company_phone}</strong></div></article></section>`;
      return;
    }

    if (state.active === "payments") {
      main.innerHTML = `<section class="section-stack"><article class="card"><h2>Payments</h2>
      ${nextPay ? `<div class="kv"><span>Amount Due</span><strong>$${nextPay.amount_due.toLocaleString()}</strong></div><div class="kv"><span>Due Date</span><strong>${new Date(nextPay.due_date).toLocaleDateString()}</strong></div><div class="kv"><span>Status</span><strong>${badge(nextPay.status)}</strong></div>` : ""}
      <button class="btn btn-primary" style="width:100%;margin-top:.6rem;">Pay Now</button></article>
      <article class="card"><h3>Payment History</h3><div class="list">${payments.map((p)=>`<div class="item"><div class="kv"><strong>$${p.amount_due.toLocaleString()}</strong>${badge(p.status)}</div><p class="muted">Due ${new Date(p.due_date).toLocaleDateString()}${p.paid_at ? ` · Paid ${fmtDate(p.paid_at)}` : ""}</p></div>`).join("")}</div></article></section>`;
      return;
    }

    if (state.active === "reminders") {
      const missed = d.missed_check_in;
      main.innerHTML = `<section class="section-stack"><article class="card"><h2>Reminders</h2><div class="list">
      ${missed ? `<div class="item"><div class="kv"><strong>Missed check-in alert</strong>${badge("attention")}</div><p class="muted">Contact your bail agent immediately to resolve missed compliance.</p></div>` : ""}
      ${reminders.map((r)=>`<div class="item"><div class="kv"><strong>${r.title}</strong>${badge(r.status)}</div><p>${r.message}</p><p class="muted">Scheduled ${fmtDate(r.scheduled_for)}</p></div>`).join("")}
      </div></article></section>`;
      return;
    }

    if (state.active === "contact") {
      main.innerHTML = `<section class="section-stack"><article class="card"><h2>Contact Office</h2>
      <p class="muted">Primary Office Hours: Mon-Fri 8:00 AM - 7:00 PM</p>
      <p class="muted">After-hours support is available for urgent case matters.</p>
      <div class="grid two" style="margin-top:.7rem;">
        <a class="btn btn-primary" href="tel:+17025550100">Call Office</a>
        <a class="btn" href="sms:+17025550100">Text Office</a>
        <a class="btn" href="mailto:support@angelicbailbonds.com">Email Office</a>
        <a class="btn" href="tel:+17025550911">After-Hours Line</a>
      </div></article></section>`;
      return;
    }

    if (state.active === "profile") {
      main.innerHTML = `<section class="section-stack"><article class="card"><h2>Profile & Settings</h2>
      <div class="kv"><span>Full Name</span><strong>${d.full_name}</strong></div>
      <div class="kv"><span>Date of Birth</span><strong>${new Date(d.dob).toLocaleDateString()}</strong></div>
      <div class="kv"><span>Phone</span><strong>${d.phone}</strong></div>
      <div class="kv"><span>Email</span><strong>${d.email}</strong></div>
      <div class="kv"><span>Emergency Contact</span><strong>${d.emergency_contact_name} · ${d.emergency_contact_phone}</strong></div>
      <h3 style="margin-top:.8rem;">Notification Preferences</h3>
      <div class="item"><label><input type="checkbox" checked /> SMS reminders</label></div>
      <div class="item"><label><input type="checkbox" checked /> Email reminders</label></div>
      <div class="item"><label><input type="checkbox" /> Voice call reminders</label></div></article></section>`;
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
