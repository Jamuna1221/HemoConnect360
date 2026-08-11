import { ApiError } from "../../shared/http/ApiError.js";

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const ALLOWED_ACTIONS = ["add", "remove", "correct"];

const ALLOWED_REASONS = [
  "Blood Collection",
  "Blood Issue",
  "Correction",
  "Other",
];

const ACTION_TO_TRANSACTION_TYPE = {
  add: "STOCK_ADDED",
  remove: "STOCK_REMOVED",
  correct: "STOCK_CORRECTION",
};

/**
 * Validate an inventory adjust request. Returns the sanitized input.
 * - bloodGroup must be one of the 8 ABO/Rh groups.
 * - action must be add / remove / correct.
 * - quantity must be a positive integer for add/remove, and a non-negative
 *   integer (absolute target) for correct.
 * - reason must be one of the allowed options.
 */
export const validateInventoryAdjust = (body) => {
  const bloodGroup = String(body?.bloodGroup || "").trim();
  if (!BLOOD_GROUPS.includes(bloodGroup)) {
    throw new ApiError(400, "Invalid blood group");
  }

  const action = String(body?.action || "").trim().toLowerCase();
  if (!ALLOWED_ACTIONS.includes(action)) {
    throw new ApiError(400, "Action must be add, remove or correct");
  }

  const quantity = Number(body?.quantity);
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new ApiError(400, "Quantity must be a non-negative integer");
  }
  if ((action === "add" || action === "remove") && quantity < 1) {
    throw new ApiError(400, "Quantity must be at least 1");
  }

  const reason = String(body?.reason || "").trim();
  if (!ALLOWED_REASONS.includes(reason)) {
    throw new ApiError(400, "Reason must be a valid stock reason");
  }

  return {
    bloodGroup,
    action,
    quantity,
    reason,
    transactionType: ACTION_TO_TRANSACTION_TYPE[action],
  };
};
