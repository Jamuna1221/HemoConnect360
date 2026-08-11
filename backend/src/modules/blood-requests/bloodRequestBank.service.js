import { createUserClient } from "../../config/supabase.js";
import { ApiError } from "../../shared/http/ApiError.js";
import { findBloodBankByUserId } from "../blood-banks/bloodBank.repository.js";
import {
  findBloodRequests,
  countBloodRequests,
  findNearbyBloodRequests,
  findBloodRequestById,
  findRequestActions,
  getRequestStats,
  acceptRequest,
  rejectRequest,
  completeRequest,
} from "./bloodRequestBank.repository.js";

const haversineKm = (lat1, lon1, lat2, lon2) => {
  if (
    [lat1, lon1, lat2, lon2].some(
      (v) => v === null || v === undefined || Number.isNaN(Number(v))
    )
  ) {
    return null;
  }

  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(Number(lat2) - Number(lat1));
  const dLon = toRad(Number(lon2) - Number(lon1));
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(Number(lat1))) *
      Math.cos(toRad(Number(lat2))) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(2 * 6371 * Math.asin(Math.sqrt(a)) * 10) / 10;
};

const toRequestDto = (row, bankLocation) => ({
  id: row.id,
  patientName: row.patient_name,
  patientAge: row.patient_age,
  patientGender: row.patient_gender,
  bloodGroup: row.blood_group,
  units: row.units_required,
  hospitalName: row.hospital_name,
  city: row.city,
  address: row.hospital_address,
  requiredBy: row.required_by,
  priority: row.priority,
  contactName: row.contact_name,
  contactPhone: row.contact_phone,
  contactEmail: row.contact_email,
  notes: row.notes,
  status: row.status,
  distanceKm:
    row.distance_km ??
    haversineKm(
      bankLocation?.latitude,
      bankLocation?.longitude,
      row.latitude,
      row.longitude
    ),
  acceptedByBloodBankId: row.accepted_by_blood_bank_id,
  rejectedByBloodBankId: row.rejected_by_blood_bank_id,
  rejectionReason: row.rejection_reason,
  acceptedAt: row.accepted_at,
  rejectedAt: row.rejected_at,
  completedAt: row.completed_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toActionDto = (row) => ({
  id: row.id,
  action: row.action,
  units: row.units,
  reason: row.reason,
  createdAt: row.created_at,
});

/**
 * Resolve the caller's own blood bank id from the verified auth user. The
 * client never supplies a blood_bank_id / user_id; ownership always comes
 * from req.user (itself derived from the validated JWT).
 */
const resolveBloodBank = async (client, userId) => {
  const profile = await findBloodBankByUserId(client, userId);
  if (!profile) {
    throw new ApiError(404, "Blood bank profile not found");
  }
  return profile;
};

export const listBloodBankRequests = async ({
  accessToken,
  user,
  filters,
}) => {
  const client = createUserClient(accessToken);
  const bank = await resolveBloodBank(client, user.id);

  const [requests, total, stats] = await Promise.all([
    findBloodRequests(client, filters),
    countBloodRequests(client, filters),
    getRequestStats(client),
  ]);

  const bankLocation = {
    latitude: bank.latitude,
    longitude: bank.longitude,
  };

  return {
    requests: requests.map((row) => toRequestDto(row, bankLocation)),
    total,
    stats,
    page: filters.page,
    limit: filters.limit,
  };
};

export const listNearbyBloodBankRequests = async ({
  accessToken,
  user,
  filters,
}) => {
  const client = createUserClient(accessToken);
  const bank = await resolveBloodBank(client, user.id);

  const bankLocation = {
    latitude: bank.latitude,
    longitude: bank.longitude,
  };

  if (
    bankLocation.latitude === null ||
    bankLocation.latitude === undefined ||
    bankLocation.longitude === null ||
    bankLocation.longitude === undefined
  ) {
    return {
      requests: [],
      total: 0,
      needsLocation: true,
      page: filters.page,
      limit: filters.limit,
    };
  }

  const { rows, total } = await findNearbyBloodRequests(client, filters);

  return {
    requests: rows.map((row) => toRequestDto(row, bankLocation)),
    total,
    needsLocation: false,
    page: filters.page,
    limit: filters.limit,
  };
};

export const getBloodBankRequestDetail = async ({ accessToken, user, id }) => {
  const client = createUserClient(accessToken);
  await resolveBloodBank(client, user.id);

  const request = await findBloodRequestById(client, id);
  if (!request) {
    throw new ApiError(404, "Blood request not found");
  }

  const actions = await findRequestActions(client, id);

  return {
    request: toRequestDto(request),
    actions: actions.map(toActionDto),
  };
};

export const acceptBloodBankRequest = async ({ accessToken, user, id }) => {
  const client = createUserClient(accessToken);
  await resolveBloodBank(client, user.id);

  await acceptRequest(client, id);

  const [detail, stats] = await Promise.all([
    getBloodBankRequestDetail({ accessToken, user, id }),
    getRequestStats(client),
  ]);

  return { ...detail, stats };
};

export const rejectBloodBankRequest = async ({
  accessToken,
  user,
  id,
  reason,
}) => {
  const client = createUserClient(accessToken);
  await resolveBloodBank(client, user.id);

  await rejectRequest(client, id, reason);

  const [detail, stats] = await Promise.all([
    getBloodBankRequestDetail({ accessToken, user, id }),
    getRequestStats(client),
  ]);

  return { ...detail, stats };
};

export const completeBloodBankRequest = async ({ accessToken, user, id }) => {
  const client = createUserClient(accessToken);
  await resolveBloodBank(client, user.id);

  await completeRequest(client, id);

  const [detail, stats] = await Promise.all([
    getBloodBankRequestDetail({ accessToken, user, id }),
    getRequestStats(client),
  ]);

  return { ...detail, stats };
};
