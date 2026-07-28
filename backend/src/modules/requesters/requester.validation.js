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

  return {
    fullName: trimOrUndefined(body?.fullName),
    age,
    gender: trimOrUndefined(body?.gender),
    city: trimOrUndefined(body?.city),
    address: trimOrUndefined(body?.address),
    bloodNeededFor: trimOrUndefined(body?.bloodNeededFor),
    email,
  };
};
