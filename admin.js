(function () {
  const session = JSON.parse(localStorage.getItem("angelic_session") || "null");
  if (!session || session.role !== "admin") window.location.href = "login.html";

  const brand = window.Branding.get();
  const sidebar = document.getElementById("adminSidebar");
  const main = document.getElementById("adminMain");
  document.getElementById("logoutBtn").onclick = () => { window.AngelicAPI.logout(); window.location.href = "login.html"; };

  const state = {
    tab: "dashboard",
    data: null,
    selectedDefendantId: null,
    search: "",
    showAddForm: false,
    filters: { active: "all", bond: "all", missed: "all", court: "all", payment: "all" }
  };

  const menu = [["dashboard", "Dashboard"], ["defendants", "Defendant List"], ["reminders", "Reminder Center"], ["activity", "Activity Log"]];
  function fmt(d) { return new Date(d).toLocaleString(); }

  function renderSidebar() {
    sidebar.innerHTML = `<p class="eyebrow">${brand.companyName}</p><h3>Case Operations</h3><p class="muted">Fast, discreet operations support across North Carolina.</p><div class="menu">${menu.map(([k,v])=>`<button class="btn ${state.tab===k?"btn-primary":"btn-outline"}" data-tab="${k}">${v}</button>`).join("")}</div><div class="help-strip"><strong>Contact</strong><p class="muted">${brand.supportPhone}<br/>${brand.supportEmail}</p></div>`;
    sidebar.querySelectorAll("button").forEach((b)=>b.onclick=()=>{state.tab=b.dataset.tab; renderSidebar(); render();});
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
    const courts = Object.fromEntries(data.court_dates.map((c)=>[c.defendant_id,c]));
    const unpaidDefendantIds = new Set(data.payments.filter((p)=>p.status !== "paid").map((p)=>p.defendant_id));

    return data.defendants.filter((d)=>{
      const searchMatch = `${d.full_name} ${d.email}`.toLowerCase().includes(state.search.toLowerCase());
      const activeMatch = state.filters.active === "all" || String(d.active) === state.filters.active;
      const bondMatch = state.filters.bond === "all" || d.bond_status === state.filters.bond;
      const missedMatch = state.filters.missed === "all" || String(d.missed_check_in) === state.filters.missed;
      const courtMatch = state.filters.court === "all" || (courts[d.id] && new Date(courts[d.id].court_datetime) <= new Date(Date.now() + 7 * 86400000));
      const paymentMatch = state.filters.payment === "all" || unpaidDefendantIds.has(d.id);
      return searchMatch && activeMatch && bondMatch && missedMatch && courtMatch && paymentMatch;
    });
  }

  function markActivity(text) {
    state.data.activity.unshift({ at: new Date().toISOString(), text });
    window.AngelicAPI.saveData(state.data);
  }

  function addDefendantSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    const now = new Date().toISOString();
    const idStamp = Date.now();

    const defendantId = `def-${idStamp}`;
    const bondId = `bond-${idStamp}`;
    const courtId = `court-${idStamp}`;
    const paymentId = `pay-${idStamp}`;

    const emergency = String(fd.get("emergency_contact") || "").trim();
    const [emergencyName, emergencyPhone] = emergency.split("|").map((v)=>v?.trim() || "");

    const defendant = {
      id: defendantId,
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
      id: bondId,
      defendant_id: defendantId,
      bond_number: String(fd.get("bond_number")).trim(),
      bond_amount: Number(fd.get("bond_amount") || 0),
      status: String(fd.get("bond_status")),
      charges: "",
      conditions: "Follow court schedule and required check-in process.",
      indemnitor_name: String(fd.get("indemnitor") || "").trim() || "Not provided",
      indemnitor_phone: "",
      company_name: brand.companyName,
      company_phone: brand.supportPhone,
      company_email: brand.supportEmail
    };

    const court = {
      id: courtId,
      defendant_id: defendantId,
      court_datetime: new Date(String(fd.get("court_datetime"))).toISOString(),
      court_address: String(fd.get("court_address") || "").trim(),
      status: "scheduled"
    };

    const payment = {
      id: paymentId,
      defendant_id: defendantId,
      amount_due: Number(fd.get("bond_amount") || 0),
      due_date: String(fd.get("payment_due_date") || ""),
      status: String(fd.get("payment_status")),
      paid_at: null,
      method: null,
      note: "New case intake payment schedule"
    };

    const noteBody = String(fd.get("note") || "").trim();
    if (noteBody) {
      state.data.notes.unshift({ id: `note-${idStamp}`, defendant_id: defendantId, author_name: "Staff", body: noteBody, created_at: now });
    }

    state.data.defendants.unshift(defendant);
    state.data.bonds.unshift(bond);
    state.data.court_dates.unshift(court);
    state.data.payments.unshift(payment);

    state.selectedDefendantId = defendantId;
    state.showAddForm = false;
    markActivity(`Defendant added: ${defendant.full_name}.`);
    window.AngelicAPI.saveData(state.data);

    state.tab = "defendants";
    renderSidebar();
    render();
  }

  function render() {
    const data = state.data;
    if (!state.selectedDefendantId) state.selectedDefendantId = data.defendants[0]?.id;
    const selected = data.defendants.find((d)=>d.id===state.selectedDefendantId);

    if (state.tab === "dashboard") {
      const active = data.defendants.filter((d)=>d.active).length;
      const upcoming = data.court_dates.filter((c)=>new Date(c.court_datetime) > new Date() && new Date(c.court_datetime) <= new Date(Date.now()+7*86400000)).length;
      const pendingPayments = data.payments.filter((p)=>p.status !== "paid").length;
      const missed = data.defendants.filter((d)=>d.missed_check_in).length;
      main.innerHTML = `<section class="section-stack">
        <article class="card"><p class="eyebrow">Operations overview</p><h2>Current case priorities</h2><div class="grid two">
          <button class="metric kpi-card" data-kpi="active"><p>Active defendants</p><p class="value">${active}</p></button>
          <button class="metric kpi-card" data-kpi="court"><p>Court dates (7 days)</p><p class="value">${upcoming}</p></button>
          <button class="metric kpi-card" data-kpi="payment"><p>Pending payments</p><p class="value">${pendingPayments}</p></button>
          <button class="metric kpi-card" data-kpi="missed"><p>Missed check-ins</p><p class="value">${missed}</p></button>
        </div></article>
        <article class="card"><h3>Recent activity</h3><div class="list">${data.activity.slice(0,12).map((a)=>`<div class="item"><div class="kv"><strong>${a.text}</strong><span class="muted">${fmt(a.at)}</span></div></div>`).join("")}</div></article>
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
      const hasFilter = state.search || Object.values(state.filters).some((v)=>v !== "all");

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
      <tbody>${rows.map((d)=>{
        const court = data.court_dates.find((c)=>c.defendant_id===d.id);
        return `<tr><td><button class="name-link" data-id="${d.id}">${d.full_name}</button><br/><span class="muted">${d.email}</span></td><td>${d.bond_status}</td><td>${court?new Date(court.court_datetime).toLocaleDateString():"N/A"}</td><td>${d.missed_check_in?"Yes":"No"}</td><td>${d.active?"Yes":"No"}</td></tr>`;
      }).join("")}</tbody></table></div>
      ${rows.length ? "" : `<div class="help-strip">No defendants match these filters.</div>`}
      </section>`;

      document.getElementById("addDefendantBtn").onclick = () => { state.showAddForm = !state.showAddForm; render(); };
      if (hasFilter) document.getElementById("clearFiltersBtn").onclick = clearFilters;
      if (state.showAddForm) {
        document.getElementById("addDefendantForm").onsubmit = addDefendantSubmit;
        document.getElementById("cancelAddDefendant").onclick = () => { state.showAddForm = false; render(); };
      }

      document.getElementById("searchInput").oninput = (e)=>{state.search=e.target.value; render();};
      document.getElementById("activeFilter").value = state.filters.active;
      document.getElementById("bondFilter").value = state.filters.bond;
      document.getElementById("missedFilter").value = state.filters.missed;
      document.getElementById("courtFilter").value = state.filters.court;
      document.getElementById("paymentFilter").value = state.filters.payment;
      document.getElementById("activeFilter").onchange=(e)=>{state.filters.active=e.target.value; render();};
      document.getElementById("bondFilter").onchange=(e)=>{state.filters.bond=e.target.value; render();};
      document.getElementById("missedFilter").onchange=(e)=>{state.filters.missed=e.target.value; render();};
      document.getElementById("courtFilter").onchange=(e)=>{state.filters.court=e.target.value; render();};
      document.getElementById("paymentFilter").onchange=(e)=>{state.filters.payment=e.target.value; render();};
      main.querySelectorAll(".name-link").forEach((nameBtn)=>nameBtn.onclick=()=>{state.selectedDefendantId=nameBtn.dataset.id; state.tab="details"; renderSidebar(); render();});
      return;
    }

    if (state.tab === "details") {
      const bond = data.bonds.find((b)=>b.defendant_id===selected.id);
      const court = data.court_dates.find((c)=>c.defendant_id===selected.id);
      const payment = data.payments.find((p)=>p.defendant_id===selected.id && p.status !== "paid") || data.payments.find((p)=>p.defendant_id===selected.id);
      const checkins = data.check_ins.filter((c)=>c.defendant_id===selected.id).sort((a,b)=>new Date(b.checked_in_at)-new Date(a.checked_in_at));
      const locs = data.location_logs.filter((l)=>l.defendant_id===selected.id).sort((a,b)=>new Date(b.captured_at)-new Date(a.captured_at));
      const notes = data.notes.filter((n)=>n.defendant_id===selected.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
      const reminders = data.reminders.filter((r)=>r.defendant_id===selected.id);

      main.innerHTML = `<section class="section-stack">
      <article class="card"><p class="eyebrow">Defendant details</p><h2>${selected.full_name}</h2><p class="muted">${selected.email} · ${selected.phone}</p>
      <div class="grid two">
        <div class="item"><strong>Bond status</strong><p>${selected.bond_status}</p></div>
        <div class="item"><strong>Active case</strong><p>${selected.active ? "Yes" : "No"}</p></div>
      </div></article>

      <article class="card"><h3>Case updates</h3>
        <div class="grid two">
          <label>Court date/time<input id="editCourtDate" type="datetime-local" value="${court ? new Date(court.court_datetime).toISOString().slice(0,16) : ""}" /></label>
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

      <article class="card"><h3>Check-in history</h3><div class="list">${checkins.map((c)=>`<div class="item"><div class="kv"><strong>${fmt(c.checked_in_at)}</strong><span>${c.latitude?`${c.latitude}, ${c.longitude}`:"Location unavailable"}</span></div></div>`).join("") || "No check-ins recorded."}</div></article>
      <article class="card"><h3>Location log</h3><div class="list">${locs.map((l)=>`<div class="item"><div class="kv"><strong>${fmt(l.captured_at)}</strong><span>${l.latitude ?? "N/A"}, ${l.longitude ?? "N/A"}</span></div><p class="muted">${l.source}</p></div>`).join("") || "No location captures recorded."}</div></article>

      <article class="card"><h3>Internal notes</h3>
        <textarea id="noteBody" placeholder="Add confidential case note"></textarea>
        <button id="addNoteBtn" class="btn" style="margin-top:.6rem;">Add note</button>
        <div class="list" style="margin-top:.7rem;">${notes.map((n)=>`<div class="item"><p>${n.body}</p><p class="muted">${n.author_name} · ${fmt(n.created_at)}</p></div>`).join("")}</div>
      </article>

      <article class="card"><h3>Reminder status</h3>
        <div class="list">${reminders.map((r)=>`<div class="item"><div class="kv"><strong>${r.title}</strong><span>${r.status}</span></div><p>${r.message}</p><button class="btn toggle-reminder" data-id="${r.id}">${r.acknowledged ? "Mark unacknowledged" : "Mark acknowledged"}</button><button class="btn toggle-sent" data-id="${r.id}">${r.status === "sent" ? "Mark pending" : "Mark sent"}</button></div>`).join("")}</div>
      </article>
      </section>`;

      document.getElementById("editBondStatus").value = selected.bond_status;
      document.getElementById("editPayStatus").value = payment?.status || "due";
      document.getElementById("editCaseActive").value = String(selected.active);
      document.getElementById("editMissed").value = String(selected.missed_check_in);

      document.getElementById("saveCaseBtn").onclick = () => {
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
        markActivity(`Case updated for ${selected.full_name}.`);
        window.AngelicAPI.saveData(data);
        render();
      };

      document.getElementById("addNoteBtn").onclick = () => {
        const body = document.getElementById("noteBody").value.trim();
        if (!body) return;
        data.notes.unshift({ id: `note-${Date.now()}`, defendant_id: selected.id, author_name: "Staff", body, created_at: new Date().toISOString() });
        markActivity(`New staff note added for ${selected.full_name}.`);
        window.AngelicAPI.saveData(data);
        render();
      };

      document.getElementById("captureLocation").onclick = () => {
        if (!navigator.geolocation) {
          markActivity(`Location capture unavailable for ${selected.full_name}: geolocation not supported.`);
          render();
          return;
        }
        navigator.geolocation.getCurrentPosition((pos) => {
          data.location_logs.unshift({ id:`loc-${Date.now()}`, defendant_id:selected.id, check_in_id:null, captured_at:new Date().toISOString(), latitude:+pos.coords.latitude.toFixed(6), longitude:+pos.coords.longitude.toFixed(6), source:"admin_capture" });
          markActivity(`Admin captured location for ${selected.full_name}.`);
          window.AngelicAPI.saveData(data);
          render();
        }, () => {
          markActivity(`Admin location capture failed for ${selected.full_name}.`);
          render();
        });
      };

      main.querySelectorAll(".toggle-reminder").forEach((btn)=>btn.onclick=()=>{
        const r = data.reminders.find((x)=>x.id===btn.dataset.id); r.acknowledged = !r.acknowledged; markActivity(`Reminder acknowledgment updated for ${selected.full_name}.`); window.AngelicAPI.saveData(data); render();
      });
      main.querySelectorAll(".toggle-sent").forEach((btn)=>btn.onclick=()=>{
        const r = data.reminders.find((x)=>x.id===btn.dataset.id); r.status = r.status === "sent" ? "pending" : "sent"; markActivity(`Reminder status updated for ${selected.full_name}.`); window.AngelicAPI.saveData(data); render();
      });
      return;
    }

    if (state.tab === "reminders") {
      const target = data.defendants.find((d)=>d.id===state.selectedDefendantId) || data.defendants[0];
      const list = data.reminders.filter((r)=>r.defendant_id===target.id);
      main.innerHTML = `<section class="card"><h2>Reminder center</h2><p class="muted">Create and track communication touchpoints clearly.</p>
      <label>Defendant<select id="remDef">${data.defendants.map((d)=>`<option value="${d.id}">${d.full_name}</option>`).join("")}</select></label>
      <div class="grid two" style="margin-top:.5rem;"><input id="remTitle" placeholder="Reminder title" /><input id="remType" placeholder="Type (court, payment, check-in)" /></div>
      <textarea id="remMessage" placeholder="Reminder message"></textarea>
      <button id="createReminder" class="btn btn-primary" style="margin-top:.6rem;">Create reminder</button>
      <div class="list" style="margin-top:.7rem;">${list.map((r)=>`<div class="item"><div class="kv"><strong>${r.title}</strong><span>${r.status}</span></div><p>${r.message}</p><p class="muted">${fmt(r.scheduled_for)} · ${r.acknowledged?"Acknowledged":"Unacknowledged"}</p></div>`).join("")}</div></section>`;
      document.getElementById("remDef").value = target.id;
      document.getElementById("remDef").onchange=(e)=>{state.selectedDefendantId=e.target.value; render();};
      document.getElementById("createReminder").onclick=()=>{
        const defendantId=document.getElementById("remDef").value;
        const title=document.getElementById("remTitle").value.trim();
        const type=document.getElementById("remType").value.trim()||"general";
        const message=document.getElementById("remMessage").value.trim();
        if(!title||!message) return;
        data.reminders.unshift({id:`rem-${Date.now()}`, defendant_id:defendantId, type, title, message, scheduled_for:new Date().toISOString(), status:"pending", acknowledged:false});
        const def = data.defendants.find((d)=>d.id===defendantId);
        markActivity(`Reminder created for ${def.full_name}.`);
        window.AngelicAPI.saveData(data);
        render();
      };
      return;
    }

    if (state.tab === "activity") {
      main.innerHTML = `<section class="card"><h2>Activity log</h2><p class="muted">Recent system and staff updates for accountability.</p><div class="list">${data.activity.map((a)=>`<div class="item"><div class="kv"><strong>${a.text}</strong><span class="muted">${fmt(a.at)}</span></div></div>`).join("")}</div></section>`;
    }
  }

  (async function init(){
    state.data = await window.AngelicAPI.getAllData();
    renderSidebar();
    render();
  })();
})();
