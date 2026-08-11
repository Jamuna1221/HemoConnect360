import { ApiError } from "../../shared/http/ApiError.js";

/**
 * All repository queries run against a request-scoped client created with the
 * caller's access token (see createUserClient), so Row Level Security applies.
 * The bank-facing data is exposed through SECURITY DEFINER RPCs (see
 * 2026-08-11-blood-bank-collections.sql) which re-verify ownership from
 * auth.uid() and never trust a blood_bank_id / user_id from the client.
 */
const handleSupabaseError = (error, fallbackMessage) => {
  if (!error) return;

  const message = String(error?.message || "");
  if (message.includes("FORBIDDEN")) {
    throw new ApiError(403, "You do not own this blood bank profile");
  }
  if (message.includes("DONOR_NOT_FOUND")) {
    throw new ApiError(404, "No donor found with this phone number");
  }
  if (message.includes("DONOR_INACTIVE")) {
    throw new ApiError(409, "This donor profile is not active");
  }
  if (message.includes("INVALID_BLOOD_GROUP")) {
    throw new ApiError(400, "Invalid blood group");
  }
  if (message.includes("BLOOD_GROUP_MISMATCH")) {
    throw new ApiError(
      400,
      "The blood group does not match the donor's registered group"
    );
  }
  if (message.includes("INVALID_UNITS")) {
    throw new ApiError(400, "Units must be a whole number between 1 and 5");
  }
  if (message.includes("FUTURE_DATE")) {
    throw new ApiError(400, "Donation date cannot be in the future");
  }
  if (message.includes("NOT_ELIGIBLE")) {
    throw new ApiError(
      409,
      "This donor is not yet eligible to donate again"
    );
  }
  if (message.includes("DUPLICATE_COLLECTION")) {
    throw new ApiError(409, "This collection has already been recorded");
  }
  // Final duplicate guard at the database level (race on the unique constraint).
  if (error.code === "23505") {
    throw new ApiError(409, "This collection has already been recorded");
  }

  throw new ApiError(500, fallbackMessage, error.message);
};

export const listAvailableDonors = async (client) => {
  const { data, error } = await client.rpc("blood_bank_available_donors");
  handleSupabaseError(error, "Unable to fetch available donors");
  return data || [];
};

export const findDonorByPhone = async (client, phone) => {
  const { data, error } = await client.rpc("blood_bank_find_donor", {
    p_phone: phone,
  });
  handleSupabaseError(error, "Unable to fetch donor details");
  return data?.[0] || null;
};

export const findCollectionHistory = async (client) => {
  const { data, error } = await client.rpc("blood_bank_collection_history");
  handleSupabaseError(error, "Unable to fetch collection history");
  return data || [];
};

export const recordCollection = async (client, input) => {
  const { data, error } = await client.rpc("blood_bank_record_collection", {
    p_donor_phone: input.donorPhone,
    p_blood_group: input.bloodGroup,
    p_donation_date: input.donationDate,
    p_units: input.units,
    p_notes: input.notes ?? null,
  });
  handleSupabaseError(error, "Unable to record the blood collection");
  return data?.[0] || null;
};
