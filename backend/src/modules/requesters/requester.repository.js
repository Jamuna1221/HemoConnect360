import supabase from "../../config/supabase.js";
import { tables } from "../../config/tables.js";
import { ApiError } from "../../shared/http/ApiError.js";

const userColumns = "id, phone, full_name, age, gender, city, address, blood_needed_for, email, role, latitude, longitude, created_at, updated_at";
const requestColumns = "id, requester_id, patient_name, patient_age, patient_gender, blood_group, units_required, hospital_name, city, hospital_address, required_by, priority, contact_name, contact_phone, contact_email, notes, status, latitude, longitude, created_at, updated_at";

const handleSupabaseError = (error, fallbackMessage) => {
  if (!error) return;
  throw new ApiError(500, fallbackMessage, error.message);
};

export const findRequesterByPhone = async (phone) => {
  const { data, error } = await supabase
    .from(tables.users)
    .select(userColumns)
    .eq("phone", phone)
    .eq("role", "requester")
    .maybeSingle();

  handleSupabaseError(error, "Unable to fetch requester account");
  return data;
};

export const findRequesterById = async (id) => {
  const { data, error } = await supabase
    .from(tables.users)
    .select(userColumns)
    .eq("id", id)
    .eq("role", "requester")
    .maybeSingle();

  handleSupabaseError(error, "Unable to fetch requester account");
  return data;
};

export const createRequesterUser = async (user) => {
  const { data, error } = await supabase
    .from(tables.users)
    .insert(user)
    .select(userColumns)
    .single();

  handleSupabaseError(error, "Unable to create requester account");
  return data;
};

export const updateRequesterUser = async (id, updates) => {
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined)
  );

  const { data, error } = await supabase
    .from(tables.users)
    .update(cleanUpdates)
    .eq("id", id)
    .eq("role", "requester")
    .select(userColumns)
    .single();

  handleSupabaseError(error, "Unable to update requester profile");
  return data;
};

export const findRequestsByRequesterId = async (requesterId) => {
  const { data, error } = await supabase
    .from(tables.bloodRequests)
    .select(requestColumns)
    .eq("requester_id", requesterId)
    .order("created_at", { ascending: false });

  handleSupabaseError(error, "Unable to fetch requester request history");
  return data || [];
};
