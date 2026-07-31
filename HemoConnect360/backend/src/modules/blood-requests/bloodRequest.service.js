import { ApiError } from "../../shared/http/ApiError.js";
import {
  insertBloodRequest,
  findRequestById,
  updateBloodRequest,
} from "./bloodRequest.repository.js";
import { findRequestsByRequesterId } from "../requesters/requester.repository.js";

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

export const createBloodRequest = async (requesterId, data) => {
  const request = await insertBloodRequest({
    requester_id: requesterId,
    patient_name: data.patientName,
    patient_age: data.patientAge,
    patient_gender: data.patientGender,
    blood_group: data.bloodGroup,
    units_required: data.units,
    hospital_name: data.hospitalName,
    city: data.city,
    hospital_address: data.address,
    required_by: data.requiredBy,
    priority: data.priority,
    contact_name: data.contactName,
    contact_phone: data.contactPhone,
    contact_email: data.contactEmail,
    notes: data.notes,
    status: "submitted",
  });

  return toRequestDto(request);
};

export const getRequesterRequests = async (requesterId) => {
  const requests = await findRequestsByRequesterId(requesterId);
  return requests.map(toRequestDto);
};

export const getRequestById = async (requestId, requesterId) => {
  const request = await findRequestById(requestId);
  if (!request) {
    throw new ApiError(404, "Blood request not found");
  }
  if (request.requester_id !== requesterId) {
    throw new ApiError(403, "You can only access your own blood requests");
  }

  return toRequestDto(request);
};

export const cancelBloodRequest = async (requestId, requesterId) => {
  const request = await findRequestById(requestId);
  if (!request) {
    throw new ApiError(404, "Blood request not found");
  }
  if (request.requester_id !== requesterId) {
    throw new ApiError(403, "You can only cancel your own blood requests");
  }
  if (request.status === "cancelled" || request.status === "fulfilled") {
    throw new ApiError(400, `Cannot cancel a request with status "${request.status}"`);
  }

  const updated = await updateBloodRequest(requestId, {
    status: "cancelled",
    updated_at: new Date().toISOString(),
  });

  return toRequestDto(updated);
};