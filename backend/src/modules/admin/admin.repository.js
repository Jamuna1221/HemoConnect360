import { tables } from "../../config/tables.js";
import { ApiError } from "../../shared/http/ApiError.js";

const handleSupabaseError = (error, fallbackMessage) => {
  if (!error) return;
  throw new ApiError(500, fallbackMessage, error.message);
};

export const fetchAllDonors = async (client) => {
  const { data, error } = await client.from(tables.donors).select("*");
  handleSupabaseError(error, "Unable to load donors");
  return data || [];
};

export const fetchAllRequesters = async (client) => {
  const { data, error } = await client
    .from(tables.users)
    .select("*")
    .eq("role", "requester");
  handleSupabaseError(error, "Unable to load requesters");
  return data || [];
};

export const fetchAllBloodRequests = async (client) => {
  const { data, error } = await client.from(tables.bloodRequests).select("*");
  handleSupabaseError(error, "Unable to load blood requests");
  return data || [];
};

export const fetchAllBloodBanks = async (client) => {
  const { data, error } = await client.from(tables.bloodBanks).select("*");
  handleSupabaseError(error, "Unable to load blood banks");
  return data || [];
};

export const fetchInventory = async (client) => {
  const { data, error } = await client.from(tables.bloodBankInventory).select("*");
  handleSupabaseError(error, "Unable to load blood bank inventory");
  return data || [];
};

export const fetchDonations = async (client) => {
  const { data, error } = await client.from("donations").select("*");
  handleSupabaseError(error, "Unable to load donation history");
  return data || [];
};

export const updateDonorVerification = async (
  client,
  donorId,
  status,
  notes,
  verifiedBy
) => {
  const { data, error } = await client
    .from(tables.donors)
    .update({
      verification_status: status,
      verification_notes: notes || null,
      verified_at: status === "pending" ? null : new Date().toISOString(),
      verified_by: status === "pending" ? null : verifiedBy || null,
    })
    .eq("id", donorId)
    .select()
    .single();

  handleSupabaseError(error, "Unable to update donor verification");
  return data;
};

export const updateRequesterVerification = async (
  client,
  requesterId,
  status,
  notes,
  verifiedBy
) => {
  const { data, error } = await client
    .from(tables.users)
    .update({
      verification_status: status,
      verification_notes: notes || null,
      verified_at: status === "pending" ? null : new Date().toISOString(),
      verified_by: status === "pending" ? null : verifiedBy || null,
    })
    .eq("id", requesterId)
    .eq("role", "requester")
    .select()
    .single();

  handleSupabaseError(error, "Unable to update requester verification");
  return data;
};

export const setBloodBankVerification = async (
  client,
  bankId,
  status,
  notes,
  adminUserId
) => {
  const { data, error } = await client.rpc(
    "admin_verify_blood_bank",
    {
      p_bank_id: bankId,
      p_status: status,
      p_notes: notes || "",
    }
  );

  handleSupabaseError(error, "Unable to update blood bank verification");
  return data || null;
};

export const updateDonorAccountStatus = async (client, donorId, status) => {
  const { data, error } = await client
    .from(tables.donors)
    .update({ status })
    .eq("id", donorId)
    .select()
    .single();

  handleSupabaseError(error, "Unable to update donor account status");
  return data;
};

export const updateRequesterAccountStatus = async (
  client,
  requesterId,
  status
) => {
  const { data, error } = await client
    .from(tables.users)
    .update({ account_status: status })
    .eq("id", requesterId)
    .eq("role", "requester")
    .select()
    .single();

  handleSupabaseError(error, "Unable to update requester account status");
  return data;
};

export const findAuthUserByEmail = async (client, email) => {
  const { data, error } = await client.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  handleSupabaseError(error, "Unable to look up admin account");
  const match = (data?.users || []).find(
    (u) => (u.email || "").toLowerCase() === (email || "").toLowerCase()
  );
  return match || null;
};

/* ── Notifications ─────────────────────────────────────────────────────── */

export const insertNotification = async (client, notification) => {
  const { data, error } = await client
    .from(tables.adminNotifications)
    .insert(notification)
    .select()
    .single();

  handleSupabaseError(error, "Unable to save notification");
  return data;
};

export const listNotifications = async (client, limit = 100) => {
  const { data, error } = await client
    .from(tables.adminNotifications)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  handleSupabaseError(error, "Unable to load notifications");
  return data || [];
};

export const markNotificationRead = async (client, id) => {
  const { data, error } = await client
    .from(tables.adminNotifications)
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  handleSupabaseError(error, "Unable to mark notification as read");
  return data;
};

export const markAllNotificationsRead = async (client) => {
  const { data, error } = await client
    .from(tables.adminNotifications)
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("is_read", false)
    .select();

  handleSupabaseError(error, "Unable to update notifications");
  return data || [];
};

/* ── Suspicious activity ───────────────────────────────────────────────── */

export const listSuspiciousActivity = async (client) => {
  const { data, error } = await client
    .from(tables.suspiciousActivity)
    .select("*")
    .order("created_at", { ascending: false });

  handleSupabaseError(error, "Unable to load suspicious activity");
  return data || [];
};

export const upsertSuspiciousActivity = async (client, flag) => {
  const { data, error } = await client
    .from(tables.suspiciousActivity)
    .upsert(flag, { onConflict: "source_key" })
    .select()
    .single();

  handleSupabaseError(error, "Unable to save suspicious activity flag");
  return data;
};

export const findSuspiciousActivityById = async (client, id) => {
  const { data, error } = await client
    .from(tables.suspiciousActivity)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  handleSupabaseError(error, "Unable to load suspicious activity flag");
  return data || null;
};

export const findSuspiciousActivityBySourceKey = async (client, sourceKey) => {
  const { data, error } = await client
    .from(tables.suspiciousActivity)
    .select("*")
    .eq("source_key", sourceKey)
    .maybeSingle();

  handleSupabaseError(error, "Unable to load suspicious activity flag");
  return data || null;
};

export const insertNotificationsIgnoreConflicts = async (client, notifications) => {
  if (!notifications.length) return [];
  const { data, error } = await client
    .from(tables.adminNotifications)
    .upsert(notifications, { onConflict: "source_key", ignoreDuplicates: true })
    .select();

  handleSupabaseError(error, "Unable to save notifications");
  return data || [];
};

export const updateSuspiciousActivity = async (client, id, updates) => {
  const { data, error } = await client
    .from(tables.suspiciousActivity)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  handleSupabaseError(error, "Unable to update suspicious activity flag");
  return data;
};

/* ── Audit logs ────────────────────────────────────────────────────────── */

export const insertAuditLog = async (client, log) => {
  const { data, error } = await client
    .from(tables.auditLogs)
    .insert(log)
    .select()
    .single();

  handleSupabaseError(error, "Unable to save audit log");
  return data;
};

export const listAuditLogs = async (client, limit = 200) => {
  const { data, error } = await client
    .from(tables.auditLogs)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  handleSupabaseError(error, "Unable to load audit logs");
  return data || [];
};

/* ── Admin settings / profile ──────────────────────────────────────────── */

export const getAdminSettings = async (client) => {
  const { data, error } = await client
    .from(tables.adminSettings)
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  handleSupabaseError(error, "Unable to load admin settings");
  return data || null;
};

export const upsertAdminSettings = async (client, settings) => {
  const { data, error } = await client
    .from(tables.adminSettings)
    .upsert({ id: 1, ...settings, updated_at: new Date().toISOString() })
    .select()
    .single();

  handleSupabaseError(error, "Unable to save admin settings");
  return data;
};

export const updateBloodRequestStatusInDb = async (client, id, status) => {
  const { data, error } = await client
    .from(tables.bloodRequests)
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  handleSupabaseError(error, "Unable to update blood request status");
  return data;
};

