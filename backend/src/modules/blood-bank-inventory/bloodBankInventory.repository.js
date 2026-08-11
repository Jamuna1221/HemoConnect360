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

export const findRecentInventoryTransactions = async (
  client,
  bloodBankId,
  limit = 20
) => {
  const { data, error } = await client
    .from(tables.bloodBankInventoryTransactions)
    .select("*")
    .eq("blood_bank_id", bloodBankId)
    .order("created_at", { ascending: false })
    .limit(limit);

  handleSupabaseError(error, "Unable to fetch inventory history");
  return data || [];
};
