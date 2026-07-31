import supabase from "../../config/supabase.js";
import { tables } from "../../config/tables.js";
import { ApiError } from "../../shared/http/ApiError.js";

const requestColumns =
  "id, requester_id, patient_name, patient_age, patient_gender, blood_group, units_required, hospital_name, city, hospital_address, required_by, priority, contact_name, contact_phone, contact_email, notes, status, created_at, updated_at";

const handleSupabaseError = (error, fallbackMessage) => {
  if (!error) return;
  throw new ApiError(500, fallbackMessage, error.message);
};

export const insertBloodRequest = async (data) => {
  const { data: request, error } = await supabase
    .from(tables.bloodRequests)
    .insert(data)
    .select(requestColumns)
    .single();

  handleSupabaseError(error, "Unable to create blood request");
  return request;
};

export const findRequestById = async (id) => {
  const { data, error } = await supabase
    .from(tables.bloodRequests)
    .select(requestColumns)
    .eq("id", id)
    .maybeSingle();

  handleSupabaseError(error, "Unable to fetch blood request");
  return data;
};

export const updateBloodRequest = async (id, updates) => {
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined)
  );

  const { data, error } = await supabase
    .from(tables.bloodRequests)
    .update(cleanUpdates)
    .eq("id", id)
    .select(requestColumns)
    .single();

  handleSupabaseError(error, "Unable to update blood request");
  return data;
};