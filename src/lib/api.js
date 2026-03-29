import { getAgencyConfig } from "./agency.js";
import { buildSeedData } from "./agencyData.js";
import { clearSession, getDataKey } from "./session.js";

const agency = getAgencyConfig();
const fallbackEnv = typeof process !== "undefined" && process.env ? process.env : {};
const browserEnv = typeof window !== "undefined" && window.__APP_ENV__ ? window.__APP_ENV__ : {};
const env = {
  ...(import.meta.env || {}),
  ...fallbackEnv,
  ...browserEnv
};
const canUseSupabase = !!(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY);
let client = null;

async function ensureSupabaseClient() {
  if (!canUseSupabase) return null;
  if (client) return client;
  const module = await import("https://esm.sh/@supabase/supabase-js@2");
  client = module.createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
  return client;
}

function loadState() {
  const raw = localStorage.getItem(getDataKey());
  const fallback = structuredClone(buildSeedData(agency));
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveState(state) {
  localStorage.setItem(getDataKey(), JSON.stringify(state));
}

function validateCheckIn(payload) {
  if (!payload?.defendantId) throw new Error("A valid defendant is required to complete check-in.");
  if (!payload?.selfieDataUrl || !payload?.selfieName) throw new Error(agency.checkInRules.validationMessage);
  if (payload?.captureMethod !== "live_camera" || !payload?.capturedAt || !payload?.checkInSessionId) {
    throw new Error(agency.checkInRules.validationMessage);
  }
}

function filterAgencyRows(rows) {
  return Array.isArray(rows) ? rows.filter((row) => !row.agency_id || row.agency_id === agency.id) : rows;
}

async function fetchTable(table) {
  const supabase = await ensureSupabaseClient();
  const query = supabase.from(table).select("*");
  if (agency.features.enforceAgencyScopeInQueries) return query.eq("agency_id", agency.id);
  return query;
}

export const api = {
  agency,
  get client() {
    return client;
  },
  useSupabaseAuth: !!(agency.features.enableSupabaseAuth && canUseSupabase),
  useSupabaseData: !!(agency.features.enableSupabaseData && canUseSupabase),

  async login(email, password, role) {
    if (this.useSupabaseAuth) {
      const supabase = await ensureSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      const current = loadState();
      const localUser = current.users.find((user) => user.email === email && user.role === role);
      if (!localUser) throw new Error("No agency-scoped user matched this sign-in.");
      return { ...localUser, supabase_user_id: data.user.id };
    }

    const state = loadState();
    const user = state.users.find((candidate) => candidate.email === email && candidate.password === password && candidate.role === role);
    if (!user) throw new Error("Invalid credentials or role selection.");
    return user;
  },

  logout() {
    clearSession();
    if (this.useSupabaseAuth && client) client.auth.signOut();
  },

  async getAllData() {
    if (!this.useSupabaseData) return loadState();
    const tables = ["users", "defendants", "bonds", "court_dates", "payments", "check_ins", "location_logs", "reminders", "notes"];
    const result = {};
    for (const table of tables) {
      const { data, error } = await fetchTable(table);
      if (error) throw new Error(error.message);
      result[table] = filterAgencyRows(data);
    }
    result.activity = [];
    return result;
  },

  async submitCheckIn(payload) {
    validateCheckIn(payload);

    const now = new Date().toISOString();
    const entryId = `ci-${Date.now()}`;
    const locationId = `loc-${Date.now()}`;
    const entry = {
      id: entryId,
      agency_id: agency.id,
      defendant_id: payload.defendantId,
      checked_in_at: now,
      source: payload.source || "mobile",
      status: "received",
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      selfie_name: payload.selfieName,
      selfie_data_url: payload.selfieDataUrl
    };
    const locationLog = {
      id: locationId,
      agency_id: agency.id,
      defendant_id: payload.defendantId,
      check_in_id: entryId,
      captured_at: now,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      source: "check_in"
    };

    if (this.useSupabaseData) {
      const supabase = await ensureSupabaseClient();
      const { error: checkInError } = await supabase.from("check_ins").insert(entry);
      if (checkInError) throw new Error(checkInError.message);
      const { error: locationError } = await supabase.from("location_logs").insert(locationLog);
      if (locationError) throw new Error(locationError.message);
      return { entry, locationLog };
    }

    const state = loadState();
    state.check_ins.unshift(entry);
    state.location_logs.unshift(locationLog);
    state.activity.unshift({
      agency_id: agency.id,
      type: "check_in",
      defendant_id: payload.defendantId,
      at: now,
      text: `${payload.defendantName || "Defendant"} check-in completed from defendant portal.`,
      selfie_data_url: payload.selfieDataUrl,
      location: {
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null
      }
    });
    saveState(state);
    return { entry, locationLog };
  },

  saveData(state) {
    saveState(state);
  }
};
