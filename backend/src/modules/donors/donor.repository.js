import supabase from "../../config/supabase.js";
import { tables } from "../../config/tables.js";
import { ApiError } from "../../shared/http/ApiError.js";

const donorColumns =
  "id, full_name, dob, gender, blood_group, phone, email, address, city, state, pincode, weight, hemoglobin, last_donation, status, created_at, updated_at";

const handleSupabaseError = (error, fallbackMessage) => {
  if (!error) return;
  throw new ApiError(500, fallbackMessage, error.message);
};

export const createDonor = async (donor) => {
  const { data, error } = await supabase
    .from(tables.donors)
    .insert(donor)
    .select(donorColumns)
    .single();

  handleSupabaseError(error, "Unable to register donor");
  return data;
};

export const findDonorByPhone = async (phone) => {
  const { data, error } = await supabase
    .from(tables.donors)
    .select(donorColumns)
    .eq("phone", phone)
    .maybeSingle();

  handleSupabaseError(error, "Unable to fetch donor");
  return data;
};
