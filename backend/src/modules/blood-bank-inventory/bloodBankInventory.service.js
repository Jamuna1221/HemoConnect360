import { createUserClient } from "../../config/supabase.js";
import { ApiError } from "../../shared/http/ApiError.js";
import { findBloodBankByUserId } from "../blood-banks/bloodBank.repository.js";
import {
  findBloodBankInventory,
  adjustStock,
  findRecentInventoryTransactions,
} from "./bloodBankInventory.repository.js";

const toInventoryDto = (row) => {
  const unitsAvailable = Number(row.units_available) || 0;
  const lowStockThreshold = Number(row.low_stock_threshold) || 0;

  const status =
    unitsAvailable === 0
      ? "OUT_OF_STOCK"
      : unitsAvailable <= lowStockThreshold
        ? "LOW_STOCK"
        : "AVAILABLE";

  return {
    id: row.id,
    bloodGroup: row.blood_group,
    unitsAvailable,
    lowStockThreshold,
    status,
    updatedAt: row.updated_at,
  };
};

const toTransactionDto = (row) => ({
  id: row.id,
  bloodGroup: row.blood_group,
  transactionType: row.transaction_type,
  reason: row.reason,
  quantityChange: row.quantity_change,
  previousQuantity: row.previous_quantity,
  newQuantity: row.new_quantity,
  createdAt: row.created_at,
});

const buildInventoryPayload = (rows) => {
  const inventory = rows.map(toInventoryDto);
  const totalUnits = inventory.reduce(
    (sum, item) => sum + item.unitsAvailable,
    0
  );
  return { inventory, totalUnits };
};

/**
 * Resolve the caller's own blood bank id from the verified auth user. The
 * frontend never supplies a blood_bank_id / user_id; ownership always comes
 * from req.user (itself derived from the validated JWT).
 */
const resolveBloodBankId = async (client, userId) => {
  const profile = await findBloodBankByUserId(client, userId);
  if (!profile) {
    throw new ApiError(404, "Blood bank profile not found");
  }
  return profile.id;
};

export const getBloodBankInventory = async ({ accessToken, user }) => {
  const client = createUserClient(accessToken);
  const bloodBankId = await resolveBloodBankId(client, user.id);
  const rows = await findBloodBankInventory(client, bloodBankId);
  return buildInventoryPayload(rows);
};

export const updateBloodBankInventory = async ({ accessToken, user, input }) => {
  const client = createUserClient(accessToken);
  const bloodBankId = await resolveBloodBankId(client, user.id);

  await adjustStock(client, {
    bloodBankId,
    bloodGroup: input.bloodGroup,
    quantity: input.quantity,
    transactionType: input.transactionType,
    reason: input.reason,
  });

  const rows = await findBloodBankInventory(client, bloodBankId);
  return buildInventoryPayload(rows);
};

export const getBloodBankInventoryHistory = async ({
  accessToken,
  user,
  limit,
}) => {
  const client = createUserClient(accessToken);
  const bloodBankId = await resolveBloodBankId(client, user.id);
  const rows = await findRecentInventoryTransactions(client, bloodBankId, limit);
  return rows.map(toTransactionDto);
};
