export function buildSeedData(agency) {
  const emailDomain = agency.slug === "angelic" ? "angelicbailbonds.com" : `${agency.slug}bail.com`;
  const selfieSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><rect width='120' height='120' rx='18' fill='%232d261f'/><circle cx='60' cy='42' r='18' fill='%23b8844b'/><rect x='28' y='68' width='64' height='28' rx='14' fill='%23b8844b'/></svg>";

  return {
    users: [
      { id: "u-def-1", agency_id: agency.id, role: "defendant", email: `defendant@${emailDomain}`, password: "Defendant@123", defendant_id: "def-1", name: "Marcus Allen" },
      { id: "u-admin-1", agency_id: agency.id, role: "admin", email: `admin@${emailDomain}`, password: "Admin@123", name: "Sofia Ramirez" }
    ],
    defendants: [
      { id: "def-1", agency_id: agency.id, full_name: "Marcus Allen", dob: "1992-07-16", phone: "(702) 555-0184", email: `defendant@${emailDomain}`, emergency_contact_name: "Angela Allen", emergency_contact_phone: "(702) 555-0118", active: true, bond_status: "active", missed_check_in: false, bail_agent_name: "Renee Harper", bail_agent_phone: agency.contact.supportPhone },
      { id: "def-2", agency_id: agency.id, full_name: "Trevor James", dob: "1986-04-09", phone: "(702) 555-0142", email: "trevor.james@example.com", emergency_contact_name: "Lena James", emergency_contact_phone: "(702) 555-0199", active: true, bond_status: "active", missed_check_in: true, bail_agent_name: "Derek Cole", bail_agent_phone: agency.contact.supportPhone },
      { id: "def-3", agency_id: agency.id, full_name: "Kayla Moore", dob: "1998-12-01", phone: "(702) 555-0125", email: "kayla.moore@example.com", emergency_contact_name: "Robert Moore", emergency_contact_phone: "(702) 555-0162", active: false, bond_status: "closed", missed_check_in: false, bail_agent_name: "Renee Harper", bail_agent_phone: agency.contact.supportPhone }
    ],
    bonds: [
      { id: "bond-1", agency_id: agency.id, defendant_id: "def-1", bond_number: `${agency.slug.toUpperCase().slice(0, 3)}-2026-00117`, bond_amount: 15000, status: "active", charges: "Non-violent felony charge", conditions: "Weekly check-in, maintain current residence, appear at all court dates.", indemnitor_name: "Angela Allen", indemnitor_phone: "(702) 555-0118", company_name: agency.companyName, company_phone: agency.contact.supportPhone, company_email: agency.supportEmailOverride || agency.contact.supportEmail }
    ],
    court_dates: [
      { id: "court-1", agency_id: agency.id, defendant_id: "def-1", court_datetime: "2026-04-03T15:00:00Z", court_address: "Regional Justice Center, 200 Lewis Ave, Las Vegas, NV 89155", status: "scheduled" },
      { id: "court-2", agency_id: agency.id, defendant_id: "def-2", court_datetime: "2026-03-31T17:30:00Z", court_address: "Clark County District Court, 601 N Pecos Rd, Las Vegas, NV 89101", status: "scheduled" }
    ],
    payments: [
      { id: "pay-1", agency_id: agency.id, defendant_id: "def-1", amount_due: 850, due_date: "2026-04-02", status: "due", paid_at: null, method: null, note: "Monthly premium installment" },
      { id: "pay-2", agency_id: agency.id, defendant_id: "def-1", amount_due: 850, due_date: "2026-03-02", status: "paid", paid_at: "2026-03-01T18:30:00Z", method: "card", note: "Monthly premium installment" }
    ],
    check_ins: [
      { id: "ci-1", agency_id: agency.id, defendant_id: "def-1", checked_in_at: "2026-03-07T16:05:00Z", source: "mobile", status: "received", latitude: 36.1602, longitude: -115.1457, selfie_name: "checkin-selfie-2026-03-07.jpg", selfie_data_url: selfieSvg },
      { id: "ci-2", agency_id: agency.id, defendant_id: "def-1", checked_in_at: "2026-03-14T16:12:00Z", source: "mobile", status: "received", latitude: 36.1629, longitude: -115.1491, selfie_name: "checkin-selfie-2026-03-14.jpg", selfie_data_url: selfieSvg },
      { id: "ci-3", agency_id: agency.id, defendant_id: "def-1", checked_in_at: "2026-03-21T16:08:00Z", source: "mobile", status: "received", latitude: 36.1644, longitude: -115.1502, selfie_name: "checkin-selfie-2026-03-21.jpg", selfie_data_url: selfieSvg }
    ],
    location_logs: [
      { id: "loc-1", agency_id: agency.id, defendant_id: "def-1", check_in_id: "ci-1", captured_at: "2026-03-07T16:05:00Z", latitude: 36.1602, longitude: -115.1457, source: "check_in" },
      { id: "loc-2", agency_id: agency.id, defendant_id: "def-1", check_in_id: "ci-2", captured_at: "2026-03-14T16:12:00Z", latitude: 36.1629, longitude: -115.1491, source: "check_in" },
      { id: "loc-3", agency_id: agency.id, defendant_id: "def-1", check_in_id: "ci-3", captured_at: "2026-03-21T16:08:00Z", latitude: 36.1644, longitude: -115.1502, source: "check_in" }
    ],
    reminders: [
      { id: "rem-1", agency_id: agency.id, defendant_id: "def-1", type: "court", title: "Court appearance reminder", message: "Court appearance scheduled April 3 at 8:00 AM local time.", scheduled_for: "2026-04-02T18:00:00Z", status: "sent", acknowledged: false },
      { id: "rem-2", agency_id: agency.id, defendant_id: "def-1", type: "payment", title: "Payment due reminder", message: "Monthly premium installment due April 2.", scheduled_for: "2026-03-30T16:00:00Z", status: "pending", acknowledged: false }
    ],
    notes: [
      { id: "note-1", agency_id: agency.id, defendant_id: "def-1", author_name: "Sofia Ramirez", body: "Completed compliance review call. Confirmed transportation for next court appearance.", created_at: "2026-03-24T20:00:00Z" },
      { id: "note-2", agency_id: agency.id, defendant_id: "def-1", author_name: "Derek Cole", body: "Payment posted in full for March cycle. Next follow-up set for April 1.", created_at: "2026-03-01T20:20:00Z" }
    ],
    activity: [
      {
        agency_id: agency.id,
        type: "check_in",
        defendant_id: "def-1",
        at: "2026-03-25T16:43:00Z",
        text: "Marcus Allen check-in completed from mobile.",
        selfie_data_url: selfieSvg,
        location: { city: "Las Vegas", state: "NV", latitude: 36.1602, longitude: -115.1457 }
      },
      { agency_id: agency.id, type: "note", defendant_id: "def-1", at: "2026-03-24T20:00:00Z", text: "Staff note added for Marcus Allen." },
      {
        agency_id: agency.id,
        type: "payment",
        defendant_id: "def-2",
        at: "2026-03-22T14:15:00Z",
        text: "Payment marked paid for Trevor James.",
        payment_amount: 250
      }
    ]
  };
}
