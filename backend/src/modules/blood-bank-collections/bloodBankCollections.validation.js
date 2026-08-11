import { ApiError } from "../../shared/http/ApiError.js";

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const normalizePhone = (phone) => String(phone || "").replace(/\D/g, "");

const toDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isValidDate = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

/**
 * Validate a record-collection request. Returns the sanitized input.
 * - donorPhone must be a 10-digit phone number (same format donors register with).
 * - bloodGroup must be one of the 8 ABO/Rh groups.
 * - donationDate must be a real YYYY-MM-DD date and not in the future.
 * - units must be a whole number between 1 and 5.
 */
export const validateRecordCollection = (body) => {
  const donorPhone = normalizePhone(body?.donorPhone);
  if (!/^\d{10}$/.test(donorPhone)) {
    throw new ApiError(400, "Valid 10-digit donor phone number is required");
  }

  const bloodGroup = String(body?.bloodGroup || "").trim().toUpperCase();
  if (!BLOOD_GROUPS.includes(bloodGroup)) {
    throw new ApiError(400, "Invalid blood group");
  }

  const donationDate = String(body?.donationDate || "").trim();
  if (!isValidDate(donationDate)) {
    throw new ApiError(400, "Valid donation date (YYYY-MM-DD) is required");
  }
  if (donationDate > toDateString(new Date())) {
    throw new ApiError(400, "Donation date cannot be in the future");
  }

  const units = Number(body?.units);
  if (!Number.isInteger(units) || units < 1 || units > 5) {
    throw new ApiError(400, "Units must be a whole number between 1 and 5");
  }

  const notes = String(body?.notes || "").trim() || undefined;

  return { donorPhone, bloodGroup, donationDate, units, notes };
};
