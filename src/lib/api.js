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
const globalSupabase = typeof window !== "undefined" ? window.__SUPABASE__ : null;
const client = globalSupabase?.client || null;
const canUseSupabase = !!client;
const storageBucket = "checkin-selfies";

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

function toDataUrlBlob(payload = "") {
  if (typeof payload !== "string" || !payload.startsWith("data:")) return null;
  const [prefix, base64] = payload.split(",", 2);
  if (!prefix || !base64) return null;
  const mime = (prefix.match(/^data:([^;]+);base64$/)?.[1] || "image/jpeg").trim();
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  } catch {
    return null;
  }
}

function filterAgencyRows(rows) {
  return Array.isArray(rows) ? rows.filter((row) => !row.agency_id || row.agency_id === agency.id) : rows;
}

async function fetchTable(table) {
  const supabase = client;
  if (!supabase) return { data: [], error: null };
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
      const supabase = client;
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
    const tableMap = {
      users: "users",
      defendants: "defendants",
      bonds: "bonds",
      court_dates: "court_dates",
      payments: "payments",
      check_ins: "check_ins",
      location_logs: "location_logs",
      reminders: "reminders",
      notes: "notes",
      activity: "activity_logs"
    };
    const result = {};
    for (const [resultKey, tableName] of Object.entries(tableMap)) {
      const { data, error } = await fetchTable(tableName);
      if (error) {
        if (resultKey === "activity") {
          result.activity = [];
          continue;
        }
        throw new Error(error.message);
      }
      const rows = filterAgencyRows(data);
      if (resultKey === "activity") {
        result.activity = rows.map((row) => ({
          id: row.id,
          agency_id: row.agency_id,
          defendant_id: row.defendant_id,
          type: row.event_type || "general",
          text: row.event_text || "",
          at: row.created_at,
          ...(row.event_meta || {})
        }));
      } else {
        result[resultKey] = rows;
      }
    }
    return result;
  },

  async submitCheckIn(payload) {
    validateCheckIn(payload);

    const now = new Date().toISOString();
    const entryId = `ci-${Date.now()}`;
    const locationId = `loc-${Date.now()}`;
    let selfieStoragePath = null;
    let selfiePublicUrl = null;
    if (this.useSupabaseData && agency.features.enableSupabaseSelfieStorage) {
      const supabase = client;
      const blob = toDataUrlBlob(payload.selfieDataUrl);
      if (blob) {
        const fileExt = blob.type.includes("png") ? "png" : "jpg";
        const filePath = `${agency.id}/${payload.defendantId}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from(storageBucket).upload(filePath, blob, {
          cacheControl: "3600",
          upsert: false,
          contentType: blob.type
        });
        if (!uploadError) {
          selfieStoragePath = filePath;
          const { data: urlData } = supabase.storage.from(storageBucket).getPublicUrl(filePath);
          selfiePublicUrl = urlData?.publicUrl || null;
        }
      }
    }

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
      selfie_data_url: payload.selfieDataUrl,
      selfie_storage_path: selfieStoragePath,
      selfie_public_url: selfiePublicUrl,
      capture_method: payload.captureMethod,
      check_in_session_id: payload.checkInSessionId
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
      const supabase = client;
      const { error: checkInError } = await supabase.from("check_ins").insert(entry);
      if (checkInError) throw new Error(checkInError.message);
      const { error: locationError } = await supabase.from("location_logs").insert(locationLog);
      if (locationError) throw new Error(locationError.message);
      const activityEntry = {
        agency_id: agency.id,
        defendant_id: payload.defendantId,
        event_type: "check_in",
        event_text: `${payload.defendantName || "Defendant"} check-in completed from defendant portal.`,
        event_meta: {
          selfie_data_url: payload.selfieDataUrl,
          selfie_public_url: selfiePublicUrl,
          location: {
            latitude: payload.latitude ?? null,
            longitude: payload.longitude ?? null
          }
        }
      };
      const { error: activityError } = await supabase.from("activity_logs").insert(activityEntry);
      if (activityError) throw new Error(activityError.message);
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
      selfie_public_url: selfiePublicUrl,
      location: {
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null
      }
    });
    saveState(state);
    return { entry, locationLog };
  },

  saveData(state) {
    if (this.useSupabaseData) {
      console.warn("saveData currently writes to local seeded mode only. Supabase mutation handlers should be implemented per action.");
      return;
    }
    saveState(state);
  }
};
