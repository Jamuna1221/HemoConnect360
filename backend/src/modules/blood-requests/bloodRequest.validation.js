import { ApiError } from "../../shared/http/ApiError.js";

const normalizePhone = (phone) => String(phone || "").replace(/\D/g, "");

export const validateCreateRequest = (body) => {
  if (!body) {
    throw new ApiError(400, "Request body is required");
  }

  const patientName = (body.patientName || "").trim();
  const patientAge = body.patientAge === undefined ? undefined : Number(body.patientAge);
  const patientGender = (body.patientGender || "").trim();
  const bloodGroup = (body.bloodGroup || "").trim();
  const units = body.units === undefined ? undefined : Number(body.units);
  const hospitalName = (body.hospitalName || "").trim();
  const city = (body.city || "").trim();
  const address = (body.address || "").trim();
  const requiredBy = (body.requiredBy || "").trim();
  const priority = (body.priority || "standard").trim();
  const contactName = (body.contactName || "").trim();
  const contactPhone = normalizePhone(body.contactPhone);
  const contactEmail = (body.contactEmail || "").trim();
  const notes = (body.notes || "").trim();

  const errors = {};

  if (!patientName) errors.patientName = "Patient name is required";
  if (
    patientAge === undefined ||
    !Number.isInteger(patientAge) ||
    patientAge < 1 ||
    patientAge > 120
  ) {
    errors.patientAge = "Valid patient age is required (1-120)";
  }
  if (!patientGender) errors.patientGender = "Patient gender is required";
  if (!bloodGroup) errors.bloodGroup = "Blood group is required";
  if (!units || units < 1) errors.units = "At least 1 unit is required";
  if (!hospitalName) errors.hospitalName = "Hospital name is required";
  if (!city) errors.city = "City is required";
  if (!address) errors.address = "Hospital address is required";
  if (!requiredBy) errors.requiredBy = "Required-by date is required";
  if (!contactName) errors.contactName = "Contact name is required";
  if (!contactPhone) errors.contactPhone = "Contact phone is required";

  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    errors.contactEmail = "Invalid contact email format";
  }

  const latitude = parseCoord(body.latitude, "Latitude", -90, 90);
  const longitude = parseCoord(body.longitude, "Longitude", -180, 180);

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, "Validation failed", errors);
  }

  return {
    patientName,
    patientAge,
    patientGender,
    bloodGroup,
    units,
    hospitalName,
    city,
    address,
    requiredBy,
    priority,
    contactName,
    contactPhone,
    contactEmail,
    notes,
    latitude,
    longitude,
  };
};

const parseCoord = (value, label, min, max) => {
  if (value === undefined || value === null || value === "") return undefined;
  const num = Number(value);
  if (!Number.isFinite(num) || num < min || num > max) {
    throw new ApiError(400, `${label} must be a number between ${min} and ${max}`);
  }
  return num;
};