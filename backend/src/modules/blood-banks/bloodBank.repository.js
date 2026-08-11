import { tables } from "../../config/tables.js";
import { ApiError } from "../../shared/http/ApiError.js";

const STORAGE_BUCKET = "blood-bank-docs";

const bloodBankColumns =
  "id, user_id, blood_bank_name, registration_number, blood_bank_type, established_year, official_email, primary_phone, alternate_phone, address_line, city, district, state, pincode, latitude, longitude, authorized_person_name, designation, authorized_person_phone, authorized_person_email, verification_status, verification_notes, verified_at, verified_by, license_doc_path, authorization_doc_path, created_at, updated_at";

/**
 * All repository queries run against a request-scoped client created with the
 * caller's access token (see createUserClient), so Row Level Security applies
 * with auth.uid() = the authenticated user.
 */
const handleSupabaseError = (error, fallbackMessage) => {
  if (!error) return;

  // Postgres unique_violation: final duplicate protection at the database
  // level (registration_number / official_email / user_id unique constraints).
  if (error.code === "23505") {
    throw new ApiError(409, "These registration details are already in use");
  }

  throw new ApiError(500, fallbackMessage, error.message);
};

export const findBloodBankByUserId = async (client, userId) => {
  const { data, error } = await client
    .from(tables.bloodBanks)
    .select(bloodBankColumns)
    .eq("user_id", userId)
    .maybeSingle();

  handleSupabaseError(error, "Unable to fetch blood bank profile");
  return data;
};

export const getBloodBankRegistrationConflicts = async (
  client,
  registrationNumber,
  officialEmail
) => {
  const { data, error } = await client.rpc("blood_banks_registration_conflicts", {
    p_registration_number: registrationNumber,
    p_official_email: officialEmail,
  });

  handleSupabaseError(error, "Unable to verify registration details");

  const row = data?.[0] || {};
  return {
    registrationNumberTaken: Boolean(row.registration_number_taken),
    officialEmailTaken: Boolean(row.official_email_taken),
  };
};

export const uploadBloodBankDocument = async (client, userId, file, label) => {
  const extension = String(file.originalname || "").split(".").pop()?.toLowerCase() || "file";
  const path = `${userId}/${label}-${Date.now()}.${extension}`;

  const { error } = await client.storage
    .from(STORAGE_BUCKET)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw new ApiError(500, `Failed to upload ${label} document`, error.message);
  }

  return path;
};

export const removeBloodBankDocuments = async (client, paths) => {
  if (!paths?.length) return;

  const { error } = await client.storage.from(STORAGE_BUCKET).remove(paths);
  if (error) {
    console.error("[blood-banks] document cleanup failed", {
      paths,
      error: error.message,
    });
  }
};

export const insertBloodBank = async (client, record) => {
  const { data, error } = await client
    .from(tables.bloodBanks)
    .insert(record)
    .select(bloodBankColumns)
    .single();

  handleSupabaseError(error, "Unable to create blood bank profile");
  return data;
};

export const findAllBloodBanks = async (client) => {
  const { data, error } = await client
    .from(tables.bloodBanks)
    .select(bloodBankColumns)
    .order("created_at", { ascending: false });

  handleSupabaseError(error, "Unable to fetch blood banks list");
  return data;
};

export const updateBloodBank = async (client, id, updates) => {
  const { data, error } = await client
    .from(tables.bloodBanks)
    .update(updates)
    .eq("id", id)
    .select(bloodBankColumns)
    .single();

  handleSupabaseError(error, "Unable to update blood bank profile");
  return data;
};

export const updateBloodBankProfile = async (client, id, updates) => {
  const { data, error } = await client
    .from(tables.bloodBanks)
    .update(updates)
    .eq("id", id)
    .select(bloodBankColumns)
    .single();

  handleSupabaseError(error, "Unable to update blood bank profile");
  return data;
};

