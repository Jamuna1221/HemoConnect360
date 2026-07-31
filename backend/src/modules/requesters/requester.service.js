import { ApiError } from "../../shared/http/ApiError.js";
import { createRequesterToken } from "../../shared/security/requesterToken.js";
import {
  createRequesterUser,
  findRequesterById,
  findRequesterByPhone,
  findRequestsByRequesterId,
  updateRequesterUser,
} from "./requester.repository.js";

const toRequesterDto = (user) => ({
  id: user.id,
  phone: user.phone,
  fullName: user.full_name || "",
  age: user.age || "",
  gender: user.gender || "",
  city: user.city || "",
  address: user.address || "",
  bloodNeededFor: user.blood_needed_for || "",
  email: user.email || "",
  createdAt: user.created_at,
  updatedAt: user.updated_at,
});

const toRequestDto = (request) => ({
  id: request.id,
  patientName: request.patient_name,
  patientAge: request.patient_age,
  patientGender: request.patient_gender,
  bloodGroup: request.blood_group,
  units: request.units_required,
  hospitalName: request.hospital_name,
  city: request.city,
  address: request.hospital_address,
  requiredBy: request.required_by,
  priority: request.priority,
  contactName: request.contact_name,
  contactPhone: request.contact_phone,
  contactEmail: request.contact_email,
  notes: request.notes,
  status: request.status,
  createdAt: request.created_at,
  updatedAt: request.updated_at,
});

const buildAccountPayload = async (user, isNew = false) => {
  const requests = await findRequestsByRequesterId(user.id);

  return {
    isNew,
    token: createRequesterToken(user),
    profile: toRequesterDto(user),
    requestHistory: requests.map(toRequestDto),
  };
};

export const loginRequesterByPhone = async (phone) => {
  const existingUser = await findRequesterByPhone(phone);

  if (existingUser) {
    return buildAccountPayload(existingUser, false);
  }

  const newUser = await createRequesterUser({ phone, role: "requester" });
  return buildAccountPayload(newUser, true);
};

export const getRequesterDetails = async (requesterId) => {
  const user = await findRequesterById(requesterId);
  if (!user) {
    throw new ApiError(404, "Requester account not found");
  }

  return buildAccountPayload(user, false);
};

export const saveRequesterProfile = async (requesterId, profile) => {
  const user = await findRequesterById(requesterId);
  if (!user) {
    throw new ApiError(404, "Requester account not found");
  }

  const updatedUser = await updateRequesterUser(requesterId, {
    full_name: profile.fullName,
    age: profile.age,
    gender: profile.gender,
    city: profile.city,
    address: profile.address,
    blood_needed_for: profile.bloodNeededFor,
    email: profile.email,
    updated_at: new Date().toISOString(),
  });

  return buildAccountPayload(updatedUser, false);
};
