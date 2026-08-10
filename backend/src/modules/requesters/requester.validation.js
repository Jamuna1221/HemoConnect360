import { ApiError } from "../../shared/http/ApiError.js";

const normalizePhone = (phone) => String(phone || "").replace(/\D/g, "");
const trimOrUndefined = (value) => {
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim();
  return trimmed || undefined;
};

export const validatePhoneLogin = (body) => {
  const phone = normalizePhone(body?.phone);

  if (!/^\d{10}$/.test(phone)) {
    throw new ApiError(400, "Valid 10-digit phone number is required");
  }

  return { phone };
};

export const validateProfileUpdate = (body) => {
  const age = body?.age === undefined || body?.age === "" ? undefined : Number(body.age);

  if (age !== undefined && (!Number.isInteger(age) || age < 1 || age > 120)) {
    throw new ApiError(400, "Age must be a number between 1 and 120");
  }

  const email = trimOrUndefined(body?.email);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  const latitude = parseNonEmptyNumber(body?.latitude, "Latitude");
  const longitude = parseNonEmptyNumber(body?.longitude, "Longitude");

  return {
    fullName: trimOrUndefined(body?.fullName),
    age,
    gender: trimOrUndefined(body?.gender),
    city: trimOrUndefined(body?.city),
    address: trimOrUndefined(body?.address),
    bloodNeededFor: trimOrUndefined(body?.bloodNeededFor),
    email,
    latitude,
    longitude,
  };
};

const parseNonEmptyNumber = (value, label) => {
  if (value === undefined || value === null || value === "") return undefined;
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new ApiError(400, `${label} must be a valid number`);
  }
  if (label === "Latitude" && (num < -90 || num > 90)) {
    throw new ApiError(400, "Latitude must be between -90 and 90");
  }
  if (label === "Longitude" && (num < -180 || num > 180)) {
    throw new ApiError(400, "Longitude must be between -180 and 180");
  }
  return num;
};
