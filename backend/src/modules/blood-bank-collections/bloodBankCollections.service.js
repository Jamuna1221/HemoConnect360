import { createUserClient } from "../../config/supabase.js";
import { ApiError } from "../../shared/http/ApiError.js";
import { findBloodBankByUserId } from "../blood-banks/bloodBank.repository.js";
import {
  listAvailableDonors,
  findDonorByPhone,
  findCollectionHistory,
  recordCollection,
} from "./bloodBankCollections.repository.js";

/**
 * Resolve the caller's own blood bank id from the verified auth user. The
 * frontend never supplies a blood_bank_id / user_id; ownership always comes
 * from req.user (itself derived from the validated JWT). The RPCs also
 * re-verify ownership from auth.uid() as defense in depth.
 */
const resolveBloodBankId = async (client, userId) => {
  const profile = await findBloodBankByUserId(client, userId);
  if (!profile) {
    throw new ApiError(404, "Blood bank profile not found");
  }
  return profile.id;
};

const toDonorDto = (row) => ({
  id: row.donor_id,
  fullName: row.full_name,
  phone: row.phone,
  bloodGroup: row.blood_group,
  city: row.city,
  gender: row.gender,
  dob: row.dob,
  weight: row.weight,
  hemoglobin: row.hemoglobin,
  lastDonation: row.last_donation,
  eligible: Boolean(row.eligible),
  nextEligible: row.next_eligible || null,
});

const toCollectionDto = (row) => ({
  id: row.id,
  donorId: row.donor_id,
  donorName: row.donor_name,
  donorPhone: row.donor_phone,
  bloodGroup: row.blood_group,
  donationDate: row.donation_date,
  units: row.units,
  city: row.city,
  notes: row.notes,
  createdAt: row.created_at,
});

export const getAvailableDonors = async ({ accessToken, user }) => {
  const client = createUserClient(accessToken);
  await resolveBloodBankId(client, user.id);
  const rows = await listAvailableDonors(client);
  return rows.map(toDonorDto);
};

export const getDonorByPhone = async ({ accessToken, user, phone }) => {
  const client = createUserClient(accessToken);
  await resolveBloodBankId(client, user.id);
  const row = await findDonorByPhone(client, phone);
  if (!row) {
    throw new ApiError(404, "No donor found with this phone number");
  }
  return toDonorDto(row);
};

export const getCollectionHistory = async ({ accessToken, user }) => {
  const client = createUserClient(accessToken);
  await resolveBloodBankId(client, user.id);
  const rows = await findCollectionHistory(client);
  return rows.map(toCollectionDto);
};

export const createBloodCollection = async ({ accessToken, user, input }) => {
  const client = createUserClient(accessToken);
  await resolveBloodBankId(client, user.id);
  const row = await recordCollection(client, input);
  if (!row) {
    throw new ApiError(500, "The collection was not recorded");
  }
  return {
    donation: {
      id: row.donation_id,
      donorId: row.donor_id,
      donorName: row.donor_name,
      bloodGroup: row.blood_group,
      donationDate: row.donation_date,
      units: row.units,
      bloodBankId: row.blood_bank_id,
      newInventoryQuantity: row.new_inventory_quantity,
    },
  };
};
