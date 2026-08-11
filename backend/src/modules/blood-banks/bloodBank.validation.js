import { ApiError } from "../../shared/http/ApiError.js";

const ALLOWED_BLOOD_BANK_TYPES = [
  "Government Blood Bank",
  "Private Blood Bank",
  "Hospital Blood Bank",
  "NGO / Trust Blood Bank",
  "Other",
];

const ALLOWED_DOC_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const ALLOWED_DOC_EXTENSIONS = ["pdf", "jpg", "jpeg", "png"];

const normalizePhone = (phone) => String(phone || "").replace(/\D/g, "");
const trimOrFail = (value, label) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) throw new ApiError(400, `${label} is required`);
  return trimmed;
};
const trimOrUndefined = (value) => {
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim();
  return trimmed || undefined;
};

const requireTenDigitPhone = (value, label) => {
  const phone = normalizePhone(value);
  if (!/^\d{10}$/.test(phone)) {
    throw new ApiError(400, `${label} must be a valid 10-digit phone number`);
  }
  return phone;
};

const optionalTenDigitPhone = (value, label) => {
  if (value === undefined || value === null || String(value).trim() === "") {
    return null;
  }
  const phone = normalizePhone(value);
  if (!/^\d{10}$/.test(phone)) {
    throw new ApiError(400, `${label} must be a valid 10-digit phone number`);
  }
  return phone;
};

const requireEmail = (value, label) => {
  const email = trimOrFail(value, label);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, `${label} must be a valid email address`);
  }
  return email;
};

const optionalEmail = (value) => {
  const email = trimOrUndefined(value);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, "Authorized person email must be a valid email address");
  }
  return email || null;
};

const parsePincode = (value) => {
  const pincode = normalizePhone(value);
  if (!/^\d{6}$/.test(pincode)) {
    throw new ApiError(400, "Pincode must be a valid 6-digit pincode");
  }
  return pincode;
};

const parseEstablishedYear = (value) => {
  if (value === undefined || value === null || String(value).trim() === "") {
    return null;
  }
  const year = Number(value);
  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(year) || year < 1900 || year > currentYear) {
    throw new ApiError(
      400,
      `Established year must be between 1900 and ${currentYear}`
    );
  }
  return year;
};

const parseOptionalNumber = (value, label, min, max) => {
  if (value === undefined || value === null || String(value).trim() === "") {
    return null;
  }
  const num = Number(value);
  if (!Number.isFinite(num) || num < min || num > max) {
    throw new ApiError(400, `${label} must be a number between ${min} and ${max}`);
  }
  return num;
};

const requireDocumentFile = (files, field, label) => {
  const file = files?.[field]?.[0];
  if (!file) {
    throw new ApiError(400, `${label} is required`);
  }

  const extension = String(file.originalname || "")
    .split(".")
    .pop()
    ?.toLowerCase();
  const validMimeType = ALLOWED_DOC_MIME_TYPES.includes(file.mimetype);
  const validExtension = ALLOWED_DOC_EXTENSIONS.includes(extension);

  if (!validMimeType || !validExtension) {
    throw new ApiError(400, `${label} must be a PDF, JPG or PNG file`);
  }

  return file;
};

const requirePassword = (value) => {
  const password = String(value || "");
  if (!password) {
    throw new ApiError(400, "Password is required");
  }
  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }
  return password;
};

/**
 * Validate the blood bank registration request. Returns a sanitized,
 * validated camelCase input object. Verification status is read ONLY to
 * reject attempts to control it - it is never used to set the stored status.
 */
export const validateBloodBankRegistration = (body, files) => {
  const submittedStatus = trimOrUndefined(body?.verification_status);
  if (submittedStatus && submittedStatus !== "PENDING_VERIFICATION") {
    throw new ApiError(
      400,
      "Verification status cannot be set during registration"
    );
  }

  const bloodBankName = trimOrFail(body?.bloodBankName, "Blood bank name");
  const registrationNumber = trimOrFail(
    body?.registrationNumber,
    "Registration number"
  );
  const bloodBankType = trimOrFail(body?.bloodBankType, "Blood bank type");
  if (!ALLOWED_BLOOD_BANK_TYPES.includes(bloodBankType)) {
    throw new ApiError(400, "Invalid blood bank type");
  }
  const establishedYear = parseEstablishedYear(body?.establishedYear);

  const officialEmail = requireEmail(body?.officialEmail, "Official email");
  const password = requirePassword(body?.password);
  const primaryPhone = requireTenDigitPhone(body?.primaryPhone, "Primary phone");
  const alternatePhone = optionalTenDigitPhone(
    body?.alternatePhone,
    "Alternate phone"
  );

  const addressLine = trimOrFail(body?.addressLine, "Address");
  const city = trimOrFail(body?.city, "City");
  const district = trimOrUndefined(body?.district) || null;
  const state = trimOrFail(body?.state, "State");
  const pincode = parsePincode(body?.pincode);
  const latitude = parseOptionalNumber(body?.latitude, "Latitude", -90, 90);
  const longitude = parseOptionalNumber(body?.longitude, "Longitude", -180, 180);

  const authorizedPersonName = trimOrFail(
    body?.authorizedName,
    "Authorized person name"
  );
  const designation = trimOrFail(body?.authorizedDesignation, "Designation");
  const authorizedPersonPhone = requireTenDigitPhone(
    body?.authorizedPhone,
    "Authorized person phone"
  );
  const authorizedPersonEmail = optionalEmail(body?.authorizedEmail);

  const licenseDoc = requireDocumentFile(
    files,
    "licenseDoc",
    "License / registration certificate"
  );
  const authorizationDoc = requireDocumentFile(
    files,
    "authorizationDoc",
    "Government authorization document"
  );

  return {
    bloodBankName,
    registrationNumber,
    bloodBankType,
    establishedYear,
    officialEmail,
    password,
    primaryPhone,
    alternatePhone,
    addressLine,
    city,
    district,
    state,
    pincode,
    latitude,
    longitude,
    authorizedPersonName,
    designation,
    authorizedPersonPhone,
    authorizedPersonEmail,
    licenseDoc,
    authorizationDoc,
  };
};

/**
 * Validate a profile update (PATCH /api/blood-banks/me).
 *
 * Every editable field is required/validated exactly like registration, so an
 * incomplete or invalid payload can never partially overwrite the profile.
 * Verification fields are explicitly rejected: they are read-only, owned by the
 * admin flow, and additionally locked by the blood_banks_verify_guard trigger.
 */
export const validateBloodBankUpdate = (body = {}) => {
  const lockedField = [
    "verificationStatus",
    "verificationNotes",
    "verifiedAt",
    "verifiedBy",
  ].find((field) => body[field] !== undefined);
  if (lockedField) {
    throw new ApiError(400, "Verification details cannot be changed here");
  }

  const bloodBankName = trimOrFail(body.bloodBankName, "Blood bank name");
  const registrationNumber = trimOrFail(
    body.registrationNumber,
    "Registration number"
  );
  const bloodBankType = trimOrFail(body.bloodBankType, "Blood bank type");
  if (!ALLOWED_BLOOD_BANK_TYPES.includes(bloodBankType)) {
    throw new ApiError(400, "Invalid blood bank type");
  }
  const establishedYear = parseEstablishedYear(body.establishedYear);

  const officialEmail = requireEmail(body.officialEmail, "Official email");
  const primaryPhone = requireTenDigitPhone(body.primaryPhone, "Primary phone");
  const alternatePhone = optionalTenDigitPhone(
    body.alternatePhone,
    "Alternate phone"
  );

  const addressLine = trimOrFail(body.addressLine, "Address");
  const city = trimOrFail(body.city, "City");
  const district = trimOrUndefined(body.district) || null;
  const state = trimOrFail(body.state, "State");
  const pincode = parsePincode(body.pincode);
  const latitude = parseOptionalNumber(body.latitude, "Latitude", -90, 90);
  const longitude = parseOptionalNumber(body.longitude, "Longitude", -180, 180);

  const authorizedPersonName = trimOrFail(
    body.authorizedPersonName,
    "Authorized person name"
  );
  const designation = trimOrFail(body.designation, "Designation");
  const authorizedPersonPhone = requireTenDigitPhone(
    body.authorizedPersonPhone,
    "Authorized person phone"
  );
  const authorizedPersonEmail = optionalEmail(body.authorizedPersonEmail);

  return {
    bloodBankName,
    registrationNumber,
    bloodBankType,
    establishedYear,
    officialEmail,
    primaryPhone,
    alternatePhone,
    addressLine,
    city,
    district,
    state,
    pincode,
    latitude,
    longitude,
    authorizedPersonName,
    designation,
    authorizedPersonPhone,
    authorizedPersonEmail,
  };
};

const SETTINGS_FIELDS = [
  "bloodRequestNotifications",
  "nearbyRequestNotifications",
  "inventoryNotifications",
  "collectionNotifications",
  "systemNotifications",
  "defaultRequestRadiusKm",
];

/**
 * Validate a settings update (PATCH /api/blood-banks/settings).
 *
 * Only the six known preference fields are accepted - anything else is
 * rejected outright (including blood_bank_id / user_id, which are always
 * derived from the JWT server-side). Boolean preferences must be real
 * booleans and the default radius must be a whole number in [1, 500],
 * matching the blood_bank_nearby_requests RPC clamp.
 */
export const validateBloodBankSettingsUpdate = (body = {}) => {
  const unknown = Object.keys(body).filter((field) => !SETTINGS_FIELDS.includes(field));
  if (unknown.length > 0) {
    throw new ApiError(400, `Unknown settings field: ${unknown[0]}`);
  }

  const booleanField = (key, label) => {
    if (body[key] === undefined) return undefined;
    if (typeof body[key] !== "boolean") {
      throw new ApiError(400, `${label} must be a boolean`);
    }
    return body[key];
  };

  let radius = body.defaultRequestRadiusKm;
  if (radius !== undefined) {
    if (!Number.isInteger(radius) || radius < 1 || radius > 500) {
      throw new ApiError(
        400,
        "Default request radius must be a whole number between 1 and 500 km"
      );
    }
    radius = Number(radius);
  }

  return {
    bloodRequestNotifications: booleanField(
      "bloodRequestNotifications",
      "Blood request notifications"
    ),
    nearbyRequestNotifications: booleanField(
      "nearbyRequestNotifications",
      "Nearby request notifications"
    ),
    inventoryNotifications: booleanField(
      "inventoryNotifications",
      "Inventory notifications"
    ),
    collectionNotifications: booleanField(
      "collectionNotifications",
      "Collection notifications"
    ),
    systemNotifications: booleanField(
      "systemNotifications",
      "System notifications"
    ),
    defaultRequestRadiusKm: radius,
  };
};
