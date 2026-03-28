(function () {
  const session = JSON.parse(localStorage.getItem("angelic_session") || "null");
  if (!session || session.role !== "admin") window.location.href = "login.html";

  const brand = window.Branding.get();
  const sidebar = document.getElementById("adminSidebar");
  const main = document.getElementById("adminMain");
  document.getElementById("logoutBtn").onclick = () => { window.AngelicAPI.logout(); window.location.href = "login.html"; };

  const state = { tab: "dashboard", data: null, selectedDefendantId: null, search: "", filters: { active: "all", bond: "all", missed: "all", court: "all" } };

  const menu = [["dashboard", "Dashboard"], ["defendants", "Defendant List"], ["profile", "Case Profile"], ["reminders", "Reminder Center"], ["activity", "Activity Log"]];
  function fmt(d) { return new Date(d).toLocaleString(); }

  function renderSidebar() {
    sidebar.innerHTML = `<p class="eyebrow">${brand.companyName}</p><h3>Case Operations</h3><p class="muted">Fast, discreet, statewide support workflow.</p><div class="menu">${menu.map(([k,v])=>`<button class="btn ${state.tab===k?"btn-primary":"btn-outline"}" data-tab="${k}">${v}</button>`).join("")}</div><div class="help-strip"><strong>Contact</strong><p class="muted">${brand.supportPhone}<br/>${brand.supportEmail}</p></div>`;
    sidebar.querySelectorAll("button").forEach((b)=>b.onclick=()=>{state.tab=b.dataset.tab; renderSidebar(); render();});
  }

  function defendantRows() {
    const data = state.data;
    const courts = Object.fromEntries(data.court_dates.map((c)=>[c.defendant_id,c]));
    return data.defendants.filter((d)=>{
      const searchMatch = `${d.full_name} ${d.email}`.toLowerCase().includes(state.search.toLowerCase());
      const activeMatch = state.filters.active === "all" || String(d.active) === state.filters.active;
      const bondMatch = state.filters.bond === "all" || d.bond_status === state.filters.bond;
      const missedMatch = state.filters.missed === "all" || String(d.missed_check_in) === state.filters.missed;
      const courtMatch = state.filters.court === "all" || (courts[d.id] && new Date(courts[d.id].court_datetime) <= new Date(Date.now() + 7 * 86400000));
      return searchMatch && activeMatch && bondMatch && missedMatch && courtMatch;
    });
  }

  function markActivity(text) {
    state.data.activity.unshift({ at: new Date().toISOString(), text });
    window.AngelicAPI.saveData(state.data);
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
        <article class="card"><p class="eyebrow">Operations overview</p><h2>Today's case priorities</h2><div class="grid two">
          <div class="metric"><p>Active defendants</p><p class="value">${active}</p></div>
          <div class="metric"><p>Court dates (7 days)</p><p class="value">${upcoming}</p></div>
          <div class="metric"><p>Pending payments</p><p class="value">${pendingPayments}</p></div>
          <div class="metric"><p>Missed check-ins</p><p class="value">${missed}</p></div>
        </div></article>
        <article class="card"><h3>Recent activity</h3><div class="list">${data.activity.slice(0,12).map((a)=>`<div class="item"><div class="kv"><strong>${a.text}</strong><span class="muted">${fmt(a.at)}</span></div></div>`).join("")}</div></article>
      </section>`;
      return;
    }

    if (state.tab === "defendants") {
      const rows = defendantRows();
      main.innerHTML = `<section class="card"><h2>Defendant directory</h2><p class="muted">Search and filter quickly to manage urgent case needs.</p>
      <div class="filters grid two">
      <input id="searchInput" placeholder="Search by name or email" value="${state.search}" />
      <select id="activeFilter"><option value="all">All status</option><option value="true">Active</option><option value="false">Inactive</option></select>
      <select id="bondFilter"><option value="all">All bond statuses</option><option value="active">Active bond</option><option value="closed">Closed bond</option></select>
      <select id="missedFilter"><option value="all">All check-in flags</option><option value="true">Missed check-in</option><option value="false">No missed check-in</option></select>
      <select id="courtFilter"><option value="all">All court windows</option><option value="upcoming">Court in 7 days</option></select>
      </div>
      <div style="overflow:auto;"><table class="table"><thead><tr><th>Name</th><th>Bond</th><th>Court</th><th>Missed</th><th>Active</th></tr></thead>
      <tbody>${rows.map((d)=>{
        const court = data.court_dates.find((c)=>c.defendant_id===d.id);
        return `<tr data-id="${d.id}"><td>${d.full_name}<br/><span class="muted">${d.email}</span></td><td>${d.bond_status}</td><td>${court?new Date(court.court_datetime).toLocaleDateString():"N/A"}</td><td>${d.missed_check_in?"Yes":"No"}</td><td>${d.active?"Yes":"No"}</td></tr>`;
      }).join("")}</tbody></table></div>
      ${rows.length ? "" : `<div class="help-strip">No defendants match these filters.</div>`}
      </section>`;
      document.getElementById("searchInput").oninput = (e)=>{state.search=e.target.value; render();};
      document.getElementById("activeFilter").value = state.filters.active;
      document.getElementById("bondFilter").value = state.filters.bond;
      document.getElementById("missedFilter").value = state.filters.missed;
      document.getElementById("courtFilter").value = state.filters.court;
      document.getElementById("activeFilter").onchange=(e)=>{state.filters.active=e.target.value; render();};
      document.getElementById("bondFilter").onchange=(e)=>{state.filters.bond=e.target.value; render();};
      document.getElementById("missedFilter").onchange=(e)=>{state.filters.missed=e.target.value; render();};
      document.getElementById("courtFilter").onchange=(e)=>{state.filters.court=e.target.value; render();};
      main.querySelectorAll("tbody tr").forEach((r)=>r.onclick=()=>{state.selectedDefendantId=r.dataset.id; state.tab="profile"; renderSidebar(); render();});
      return;
    }

    if (state.tab === "profile") {
      const bond = data.bonds.find((b)=>b.defendant_id===selected.id);
      const court = data.court_dates.find((c)=>c.defendant_id===selected.id);
      const payment = data.payments.find((p)=>p.defendant_id===selected.id && p.status !== "paid") || data.payments.find((p)=>p.defendant_id===selected.id);
      const checkins = data.check_ins.filter((c)=>c.defendant_id===selected.id).sort((a,b)=>new Date(b.checked_in_at)-new Date(a.checked_in_at));
      const locs = data.location_logs.filter((l)=>l.defendant_id===selected.id).sort((a,b)=>new Date(b.captured_at)-new Date(a.captured_at));
      const notes = data.notes.filter((n)=>n.defendant_id===selected.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
      const reminders = data.reminders.filter((r)=>r.defendant_id===selected.id);

      main.innerHTML = `<section class="section-stack">
      <article class="card"><p class="eyebrow">Case profile</p><h2>${selected.full_name}</h2><p class="muted">${selected.email} · ${selected.phone}</p>
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
      main.innerHTML = `<section class="card"><h2>Reminder center</h2><p class="muted">Create and track communication touchpoints quickly.</p>
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
