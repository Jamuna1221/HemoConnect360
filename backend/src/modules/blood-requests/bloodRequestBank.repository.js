import { tables } from "../../config/tables.js";
import { ApiError } from "../../shared/http/ApiError.js";

const bankRequestColumns =
  "id, requester_id, patient_name, patient_age, patient_gender, blood_group, units_required, hospital_name, city, hospital_address, required_by, priority, contact_name, contact_phone, contact_email, notes, status, latitude, longitude, accepted_by_blood_bank_id, rejected_by_blood_bank_id, rejection_reason, accepted_at, rejected_at, completed_at, created_at, updated_at";

export const OPEN_STATUSES = [
  "submitted",
  "notified",
  "searching_donors",
  "accepted",
];

export const DECIDED_STATUSES = ["approved", "rejected", "completed"];

/**
 * All queries run against a request-scoped client created with the caller's
 * access token (see createUserClient). Mutations always happen inside the
 * SECURITY DEFINER RPCs, which resolve the bank from auth.uid() and lock rows.
 */
const handleSupabaseError = (error, fallbackMessage) => {
  if (!error) return;

  const message = String(error?.message || "");
  if (message.includes("INSUFFICIENT_STOCK")) {
    throw new ApiError(
      400,
      "Not enough stock available to fulfill this request"
    );
  }
  if (message.includes("REQUEST_NOT_OPEN")) {
    throw new ApiError(409, "This request has already been handled");
  }
  if (message.includes("REQUEST_NOT_FOUND")) {
    throw new ApiError(404, "Blood request not found");
  }
  if (message.includes("FORBIDDEN")) {
    throw new ApiError(
      403,
      "You are not authorized to manage this blood request"
    );
  }

  throw new ApiError(500, fallbackMessage, error.message);
};

const applyFilters = (builder, filters) => {
  const { status, bloodGroup, priority, search } = filters;

  if (status === "open") {
    builder = builder.in("status", OPEN_STATUSES);
  } else if (status === "decided") {
    builder = builder.in("status", DECIDED_STATUSES);
  } else if (status && status !== "all") {
    builder = builder.eq("status", status);
  }

  if (bloodGroup) {
    builder = builder.eq("blood_group", bloodGroup);
  }

  if (priority) {
    builder = builder.eq("priority", priority);
  }

  if (search) {
    const pattern = `%${search}%`;
    builder = builder.or(
      `patient_name.ilike.${pattern},hospital_name.ilike.${pattern},city.ilike.${pattern},contact_name.ilike.${pattern},contact_phone.ilike.${pattern}`
    );
  }

  return builder;
};

export const findBloodRequests = async (client, filters) => {
  const { page, limit } = filters;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error } = await applyFilters(
    client
      .from(tables.bloodRequests)
      .select(bankRequestColumns)
      .order("created_at", { ascending: false })
      .range(from, to),
    filters
  );

  handleSupabaseError(error, "Unable to fetch blood requests");
  return data || [];
};

export const countBloodRequests = async (client, filters) => {
  const { data, error, count } = await applyFilters(
    client
      .from(tables.bloodRequests)
      .select("id", { count: "exact", head: true }),
    filters
  );

  handleSupabaseError(error, "Unable to count blood requests");
  return count ?? (data || []).length;
};

export const findBloodRequestById = async (client, id) => {
  const { data, error } = await client
    .from(tables.bloodRequests)
    .select(bankRequestColumns)
    .eq("id", id)
    .maybeSingle();

  handleSupabaseError(error, "Unable to fetch blood request");
  return data;
};

export const findRequestActions = async (client, requestId) => {
  const { data, error } = await client
    .from(tables.bloodRequestBankActions)
    .select("*")
    .eq("blood_request_id", requestId)
    .order("created_at", { ascending: false });

  handleSupabaseError(error, "Unable to fetch request actions");
  return data || [];
};

export const getRequestStats = async (client) => {
  const { data, error } = await client.rpc("blood_requests_stats");

  handleSupabaseError(error, "Unable to compute request stats");

  const counts = {
    submitted: 0,
    notified: 0,
    searching_donors: 0,
    accepted: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
    cancelled: 0,
    fulfilled: 0,
  };

  for (const row of data || []) {
    if (row?.status && row?.count != null) {
      counts[row.status] = Number(row.count) || 0;
    }
  }

  const open =
    counts.submitted +
    counts.notified +
    counts.searching_donors +
    counts.accepted;

  return {
    open,
    approved: counts.approved,
    rejected: counts.rejected,
    completed: counts.completed,
    cancelled: counts.cancelled,
    total: Object.values(counts).reduce((sum, n) => sum + n, 0),
  };
};

export const acceptRequest = async (client, requestId) => {
  const { data, error } = await client.rpc("blood_bank_accept_request", {
    p_request_id: requestId,
  });

  handleSupabaseError(error, "Unable to accept blood request");
  return data?.[0] || null;
};

export const rejectRequest = async (client, requestId, reason) => {
  const { data, error } = await client.rpc("blood_bank_reject_request", {
    p_request_id: requestId,
    p_reason: reason,
  });

  handleSupabaseError(error, "Unable to reject blood request");
  return data?.[0] || null;
};

export const completeRequest = async (client, requestId) => {
  const { data, error } = await client.rpc("blood_bank_complete_request", {
    p_request_id: requestId,
  });

  handleSupabaseError(error, "Unable to complete blood request");
  return data?.[0] || null;
};
