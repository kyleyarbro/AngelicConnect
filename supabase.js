(function () {
  const fallbackData = {
    users: [
      { id: "u-def-1", role: "defendant", email: "defendant@angelicbailbonds.com", password: "Defendant@123", defendant_id: "def-1", name: "Marcus Allen" },
      { id: "u-admin-1", role: "admin", email: "admin@angelicbailbonds.com", password: "Admin@123", name: "Sofia Ramirez" }
    ],
    defendants: [
      { id: "def-1", full_name: "Marcus Allen", dob: "1992-07-16", phone: "(702) 555-0184", email: "defendant@angelicbailbonds.com", emergency_contact_name: "Angela Allen", emergency_contact_phone: "(702) 555-0118", active: true, bond_status: "active", missed_check_in: false, bail_agent_name: "Renee Harper" },
      { id: "def-2", full_name: "Trevor James", dob: "1986-04-09", phone: "(702) 555-0142", email: "trevor.james@example.com", emergency_contact_name: "Lena James", emergency_contact_phone: "(702) 555-0199", active: true, bond_status: "active", missed_check_in: true, bail_agent_name: "Derek Cole" },
      { id: "def-3", full_name: "Kayla Moore", dob: "1998-12-01", phone: "(702) 555-0125", email: "kayla.moore@example.com", emergency_contact_name: "Robert Moore", emergency_contact_phone: "(702) 555-0162", active: false, bond_status: "closed", missed_check_in: false, bail_agent_name: "Renee Harper" }
    ],
    bonds: [
      { id: "bond-1", defendant_id: "def-1", bond_number: "ABB-2026-00117", bond_amount: 15000, status: "active", charges: "Non-violent felony charge", conditions: "Weekly check-in, maintain current residence, appear at all court dates.", indemnitor_name: "Angela Allen", indemnitor_phone: "(702) 555-0118", company_name: "Angelic Bail Bonds", company_phone: "(702) 555-0100", company_email: "support@angelicbailbonds.com" }
    ],
    court_dates: [
      { id: "court-1", defendant_id: "def-1", court_datetime: "2026-04-03T15:00:00Z", court_address: "Regional Justice Center, 200 Lewis Ave, Las Vegas, NV 89155", status: "scheduled" },
      { id: "court-2", defendant_id: "def-2", court_datetime: "2026-03-31T17:30:00Z", court_address: "Clark County District Court, 601 N Pecos Rd, Las Vegas, NV 89101", status: "scheduled" }
    ],
    payments: [
      { id: "pay-1", defendant_id: "def-1", amount_due: 850, due_date: "2026-04-02", status: "due", paid_at: null, method: null, note: "Monthly premium installment" },
      { id: "pay-2", defendant_id: "def-1", amount_due: 850, due_date: "2026-03-02", status: "paid", paid_at: "2026-03-01T18:30:00Z", method: "card", note: "Monthly premium installment" }
    ],
    check_ins: [
      { id: "ci-1", defendant_id: "def-1", checked_in_at: "2026-03-07T16:05:00Z", source: "mobile", status: "received", latitude: 36.1602, longitude: -115.1457 },
      { id: "ci-2", defendant_id: "def-1", checked_in_at: "2026-03-14T16:12:00Z", source: "mobile", status: "received", latitude: 36.1629, longitude: -115.1491 },
      { id: "ci-3", defendant_id: "def-1", checked_in_at: "2026-03-21T16:08:00Z", source: "mobile", status: "received", latitude: 36.1644, longitude: -115.1502 }
    ],
    location_logs: [
      { id: "loc-1", defendant_id: "def-1", check_in_id: "ci-1", captured_at: "2026-03-07T16:05:00Z", latitude: 36.1602, longitude: -115.1457, source: "check_in" },
      { id: "loc-2", defendant_id: "def-1", check_in_id: "ci-2", captured_at: "2026-03-14T16:12:00Z", latitude: 36.1629, longitude: -115.1491, source: "check_in" },
      { id: "loc-3", defendant_id: "def-1", check_in_id: "ci-3", captured_at: "2026-03-21T16:08:00Z", latitude: 36.1644, longitude: -115.1502, source: "check_in" }
    ],
    reminders: [
      { id: "rem-1", defendant_id: "def-1", type: "court", title: "Court appearance reminder", message: "Court appearance scheduled April 3 at 8:00 AM local time.", scheduled_for: "2026-04-02T18:00:00Z", status: "sent", acknowledged: false },
      { id: "rem-2", defendant_id: "def-1", type: "payment", title: "Payment due reminder", message: "Monthly premium installment due April 2.", scheduled_for: "2026-03-30T16:00:00Z", status: "pending", acknowledged: false }
    ],
    notes: [
      { id: "note-1", defendant_id: "def-1", author_name: "Sofia Ramirez", body: "Completed compliance review call. Confirmed transportation for next court appearance.", created_at: "2026-03-24T20:00:00Z" },
      { id: "note-2", defendant_id: "def-1", author_name: "Derek Cole", body: "Payment posted in full for March cycle. Next follow-up set for April 1.", created_at: "2026-03-01T20:20:00Z" }
    ],
    activity: [
      { at: "2026-03-25T16:43:00Z", text: "Marcus Allen check-in completed from mobile." },
      { at: "2026-03-24T20:00:00Z", text: "Staff note added for Marcus Allen." },
      { at: "2026-03-22T14:15:00Z", text: "Payment marked paid for Trevor James." }
    ]
  };

  function loadState() {
    const raw = localStorage.getItem("angelic_data");
    if (!raw) return structuredClone(fallbackData);
    try { return JSON.parse(raw); } catch { return structuredClone(fallbackData); }
  }
  function saveState(state) { localStorage.setItem("angelic_data", JSON.stringify(state)); }

  const config = window.APP_CONFIG || {};
  const canUseSupabase = config.supabaseUrl && config.supabaseAnonKey && window.supabase;
  const client = canUseSupabase ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey) : null;

  const api = {
    client,
    useSupabaseAuth: !!(config.useSupabaseAuth && client),
    useSupabaseData: !!(config.useSupabaseData && client),

    async login(email, password, role) {
      if (this.useSupabaseAuth) {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);
        const current = loadState();
        const localUser = current.users.find((u) => u.email === email && u.role === role);
        return { ...localUser, supabase_user_id: data.user.id };
      }
      const state = loadState();
      const user = state.users.find((u) => u.email === email && u.password === password && u.role === role);
      if (!user) throw new Error("Invalid credentials or role selection.");
      return user;
    },

    logout() {
      localStorage.removeItem("angelic_session");
      if (this.useSupabaseAuth) client.auth.signOut();
    },

    async getAllData() {
      if (!this.useSupabaseData) return loadState();
      const tables = ["users", "defendants", "bonds", "court_dates", "payments", "check_ins", "location_logs", "reminders", "notes"];
      const result = {};
      for (const t of tables) {
        const { data, error } = await client.from(t).select("*");
        if (error) throw new Error(error.message);
        result[t] = data;
      }
      return result;
    },

    saveData(state) {
      saveState(state);
    }
  };

  window.AngelicAPI = api;
})();
