import { ApiError } from "../../shared/http/ApiError.js";

const normalizePhone = (phone) => String(phone || "").replace(/\D/g, "");
const trimOrFail = (value, label) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) throw new ApiError(400, `${label} is required`);
  return trimmed;
};

export const validateDonorRegistration = (body) => {
  const fullName = trimOrFail(body?.fullName, "Full name");
  const dob = trimOrFail(body?.dob, "Date of birth");
  const gender = trimOrFail(body?.gender, "Gender");
  const bloodGroup = trimOrFail(body?.bloodGroup, "Blood group");
  const phone = normalizePhone(body?.phone);
  const address = trimOrFail(body?.address, "Address");
  const city = trimOrFail(body?.city, "City");
  const state = trimOrFail(body?.state, "State");
  const pincode = trimOrFail(body?.pincode, "Pincode");

  if (!/^\d{10}$/.test(phone)) {
    throw new ApiError(400, "Valid 10-digit phone number is required");
  }

  const weight = Number(body?.weight);
  if (!weight || weight < 45) {
    throw new ApiError(400, "Weight must be at least 45 kg to donate blood");
  }

  const hemoglobin = Number(body?.hemoglobin);
  if (!hemoglobin || hemoglobin < 12.5) {
    throw new ApiError(400, "Hemoglobin must be at least 12.5 g/dL");
  }

  const email = String(body?.email || "").trim() || undefined;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  // Validate dob: age 18–65
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  if (age < 18 || age > 65) {
    throw new ApiError(400, "Donor must be between 18 and 65 years old");
  }

  return {
    fullName,
    dob,
    gender,
    bloodGroup,
    phone,
    email,
    address,
    city,
    state,
    pincode,
    weight,
    hemoglobin,
    lastDonation: String(body?.lastDonation || "").trim() || null,
  };
};
