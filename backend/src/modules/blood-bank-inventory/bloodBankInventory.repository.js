import { tables } from "../../config/tables.js";
import { ApiError } from "../../shared/http/ApiError.js";

/**
 * All repository queries run against a request-scoped client created with the
 * caller's access token (see createUserClient), so Row Level Security applies
 * with auth.uid() = the authenticated user.
 */
const handleSupabaseError = (error, fallbackMessage) => {
  if (!error) return;

  const message = String(error?.message || "");
  if (message.includes("INSUFFICIENT_STOCK")) {
    throw new ApiError(
      400,
      "Cannot remove more units than are currently in stock"
    );
  }
  if (message.includes("FORBIDDEN")) {
    throw new ApiError(403, "You do not own this blood bank inventory");
  }

  throw new ApiError(500, fallbackMessage, error.message);
};

export const findBloodBankInventory = async (client, bloodBankId) => {
  const { data, error } = await client
    .from(tables.bloodBankInventory)
    .select("*")
    .eq("blood_bank_id", bloodBankId)
    .order("blood_group");

  handleSupabaseError(error, "Unable to fetch blood bank inventory");
  return data || [];
};

export const adjustStock = async (
  client,
  { bloodBankId, bloodGroup, quantity, transactionType, reason }
) => {
  const { data, error } = await client.rpc("adjust_blood_bank_inventory", {
    p_blood_bank_id: bloodBankId,
    p_blood_group: bloodGroup,
    p_quantity: quantity,
    p_transaction_type: transactionType,
    p_reason: reason,
  });

  handleSupabaseError(error, "Unable to update inventory");
  return data?.[0]?.new_quantity ?? 0;
};

/**
 * Load the signed-in blood bank's inventory transactions, newest first.
 *
 * Supports optional backend-side filtering (blood group, transaction type and
 * an inclusive created_at date range) and, when `page` is provided, offset
 * pagination with an exact row count. Without `page` it keeps the legacy
 * behaviour of returning just the `limit` most recent rows.
 *
 * @param {Object} client - request-scoped Supabase client (RLS applies)
 * @param {string} bloodBankId - resolved from the authenticated user, never client-supplied
 * @param {Object} [options]
 * @param {number} [options.limit=20]
 * @param {number|null} [options.page=null] - 1-based page; null disables paging
 * @param {Object} [options.filters]
 * @param {string} [options.filters.bloodGroup]
 * @param {string} [options.filters.transactionType]
 * @param {string} [options.filters.from] - ISO timestamp / date string
 * @param {string} [options.filters.to] - ISO timestamp / date string
 * @returns {Promise<{ rows: Array, count: number }>}
 */
export const findInventoryTransactions = async (
  client,
  bloodBankId,
  options = {}
) => {
  const { limit = 20, page = null, filters = {} } = options;
  const paging = Number.isInteger(page) && page >= 1;

  let query = client
    .from(tables.bloodBankInventoryTransactions)
    .select("*", paging ? { count: "exact" } : undefined)
    .eq("blood_bank_id", bloodBankId);

  if (filters.bloodGroup) query = query.eq("blood_group", filters.bloodGroup);
  if (filters.transactionType) {
    query = query.eq("transaction_type", filters.transactionType);
  }
  if (filters.from) query = query.gte("created_at", filters.from);
  if (filters.to) query = query.lte("created_at", filters.to);

  query = query.order("created_at", { ascending: false });

  if (paging) {
    const start = (page - 1) * limit;
    query = query.range(start, start + limit - 1);
  } else {
    query = query.limit(limit);
  }

  const { data, error, count } = await query;
  handleSupabaseError(error, "Unable to fetch inventory history");
  return { rows: data || [], count: count ?? 0 };
};
