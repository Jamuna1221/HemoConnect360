import { createUserClient } from "../../config/supabase.js";
import { ApiError } from "../../shared/http/ApiError.js";
import { findBloodBankByUserId } from "../blood-banks/bloodBank.repository.js";
import {
  BLOOD_GROUPS,
} from "./bloodBankInventory.validation.js";
import {
  findBloodBankInventory,
  adjustStock,
  findInventoryTransactions,
} from "./bloodBankInventory.repository.js";

const VALID_TRANSACTION_TYPES = [
  "STOCK_ADDED",
  "STOCK_REMOVED",
  "STOCK_CORRECTION",
];

/**
 * Normalize a user-supplied date to an inclusive day boundary. Plain date
 * strings (YYYY-MM-DD) become the start/end of that UTC day so a `to` filter
 * includes every record within the selected day.
 */
const toDayBoundary = (value, endOfDay) => {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return endOfDay ? `${value}T23:59:59.999Z` : `${value}T00:00:00.000Z`;
  }
  return value;
};

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
  page,
  filters = {},
}) => {
  const client = createUserClient(accessToken);
  const bloodBankId = await resolveBloodBankId(client, user.id);

  const sanitizedFilters = {
    bloodGroup: BLOOD_GROUPS.includes(filters.bloodGroup)
      ? filters.bloodGroup
      : null,
    transactionType: VALID_TRANSACTION_TYPES.includes(filters.transactionType)
      ? filters.transactionType
      : null,
    from: toDayBoundary(filters.from, false),
    to: toDayBoundary(filters.to, true),
  };

  const { rows, count } = await findInventoryTransactions(
    client,
    bloodBankId,
    { limit, page, filters: sanitizedFilters }
  );

  const transactions = rows.map(toTransactionDto);

  // Legacy shape (no page): a plain list of the most recent rows, as the
  // existing Blood Inventory widget expects. Paginated callers get the full
  // result set with totals for building a pager.
  if (!Number.isInteger(page) || page < 1) {
    return transactions;
  }

  return {
    transactions,
    total: count,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(count / limit)),
  };
};
