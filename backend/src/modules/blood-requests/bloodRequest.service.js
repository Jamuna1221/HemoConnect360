import { ApiError } from "../../shared/http/ApiError.js";
import {
  insertBloodRequest,
  findRequestById,
  updateBloodRequest,
} from "./bloodRequest.repository.js";
import { findRequestsByRequesterId } from "../requesters/requester.repository.js";
import { env } from "../../config/env.js";
import supabase from "../../config/supabase.js";
import { notifyDonorsOfRequest, notifyRequesterOfMatch } from "../notifications/push.service.js";

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
  latitude: request.latitude,
  longitude: request.longitude,
  acceptedByBloodBankId: request.accepted_by_blood_bank_id,
  rejectedByBloodBankId: request.rejected_by_blood_bank_id,
  rejectionReason: request.rejection_reason,
  acceptedAt: request.accepted_at,
  rejectedAt: request.rejected_at,
  completedAt: request.completed_at,
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
    latitude: data.latitude,
    longitude: data.longitude,
    status: "submitted",
  });

  let matches = [];
  if (data.latitude !== undefined && data.longitude !== undefined) {
    try {
      matches = await matchDonorsForRequest(request);
    } catch (error) {
      console.error("[blood-request] donor matching failed", {
        requestId: request.id,
        error: error.message,
      });
    }
  }

  await notifyDonorsOfRequest({
    donorIds: matches.map((match) => match.donorId),
    bloodGroup: request.blood_group,
    hospitalName: request.hospital_name,
  });
  await notifyRequesterOfMatch({
    requesterId,
    donorCount: matches.length,
    bloodGroup: request.blood_group,
  });

  return {
    ...toRequestDto(request),
    status: matches.length > 0 ? "notified" : "searching_donors",
    matches,
  };
};

// Statuses that are final or bank-managed must never be overridden by the
// donor-matching derivation below.
const FIXED_STATUSES = [
  "cancelled",
  "fulfilled",
  "approved",
  "rejected",
  "completed",
];

const withMatchStatus = async (request) => {
  if (FIXED_STATUSES.includes(request.status)) {
    return request;
  }

  const { data: matches, error } = await supabase
    .from("donor_matches")
    .select("status")
    .eq("blood_request_id", request.id);

  if (error) {
    console.warn("[blood-request] Could not derive match status", {
      requestId: request.id,
      error: error.message,
    });
    return request;
  }

  const activeMatches = matches?.filter((match) => !["rejected", "declined", "ineligible_after_donation"].includes(match.status)) || [];
  const status = activeMatches.some((match) => match.status === "donated")
    ? "completed"
    : activeMatches.some((match) => match.status === "accepted")
      ? "accepted"
    : activeMatches.length > 0
      ? "notified"
      : "searching_donors";

  return { ...request, status };
};

/**
 * Calls the Supabase RPC `match_nearby_donors` (SECURITY DEFINER) to find
 * eligible donors near the hospital location and persist donor_matches.
 *
 * @param {Object} request - the raw inserted blood request row
 * @returns {Promise<Array<{donorId, fullName, phone, bloodGroup, city, distanceKm}>>}
 */
export const matchDonorsForRequest = async (request) => {
  const { data, error } = await supabase.rpc("match_nearby_donors", {
    p_request_id: request.id,
    p_latitude: Number(request.latitude),
    p_longitude: Number(request.longitude),
    p_required_group: request.blood_group,
    p_required_by: request.required_by,
    p_radius_km: env.donorMatchRadiusKm,
    p_max_donors: env.donorMatchMaxDonors,
  });

  if (error) {
    throw new Error(`match_nearby_donors failed: ${error.message}`);
  }

  return (data || []).map((row) => ({
    donorId: row.donor_id,
    fullName: row.full_name,
    phone: row.phone,
    bloodGroup: row.blood_group,
    city: row.city,
    distanceKm: row.distance_km,
  }));
};

export const getMatchesForRequest = async (requestId, requesterId) => {
  const { data, error } = await supabase.rpc("get_request_matches", {
    p_request_id: requestId,
    p_requester_id: requesterId,
  });

  if (error) {
    throw new Error(`get_request_matches failed: ${error.message}`);
  }

  return (data || []).map((row) => ({
    donorId: row.donor_id,
    fullName: row.full_name,
    phone: row.phone,
    bloodGroup: row.blood_group,
    city: row.city,
    distanceKm: row.distance_km,
    matchScore: row.match_score,
    status: row.status,
    acceptedCount: row.accepted_count,
    maxAccepted: row.max_accepted,
  }));
};

export const getRequesterRequests = async (requesterId) => {
  const requests = await findRequestsByRequesterId(requesterId);
  const withStatuses = await Promise.all(requests.map(withMatchStatus));
  return withStatuses.map(toRequestDto);
};

export const getRequestById = async (requestId, requesterId) => {
  const request = await findRequestById(requestId);
  if (!request) {
    throw new ApiError(404, "Blood request not found");
  }
  if (request.requester_id !== requesterId) {
    throw new ApiError(403, "You can only access your own blood requests");
  }

  return toRequestDto(await withMatchStatus(request));
};

export const cancelBloodRequest = async (requestId, requesterId) => {
  const request = await findRequestById(requestId);
  if (!request) {
    throw new ApiError(404, "Blood request not found");
  }
  if (request.requester_id !== requesterId) {
    throw new ApiError(403, "You can only cancel your own blood requests");
  }
  if (FIXED_STATUSES.includes(request.status)) {
    throw new ApiError(400, `Cannot cancel a request with status "${request.status}"`);
  }

  const updated = await updateBloodRequest(requestId, {
    status: "cancelled",
    updated_at: new Date().toISOString(),
  });

  return toRequestDto(updated);
};
