import { ApiError } from "../../shared/http/ApiError.js";
import { createDonor, findDonorByPhone } from "./donor.repository.js";

const toDonorDto = (donor) => ({
  id: donor.id,
  fullName: donor.full_name,
  dob: donor.dob,
  gender: donor.gender,
  bloodGroup: donor.blood_group,
  phone: donor.phone,
  email: donor.email,
  address: donor.address,
  city: donor.city,
  state: donor.state,
  pincode: donor.pincode,
  weight: donor.weight,
  hemoglobin: donor.hemoglobin,
  lastDonation: donor.last_donation || null,
  latitude: donor.latitude,
  longitude: donor.longitude,
  status: donor.status,
  createdAt: donor.created_at,
  updatedAt: donor.updated_at,
});

export const registerDonor = async (donorData) => {
  // Check if phone already registered
  const existing = await findDonorByPhone(donorData.phone);
  if (existing) {
    throw new ApiError(
      409,
      "A donor with this phone number is already registered"
    );
  }

  const record = {
    full_name: donorData.fullName,
    dob: donorData.dob,
    gender: donorData.gender,
    blood_group: donorData.bloodGroup,
    phone: donorData.phone,
    email: donorData.email || null,
    address: donorData.address,
    city: donorData.city,
    state: donorData.state,
    pincode: donorData.pincode,
    weight: Number(donorData.weight),
    hemoglobin: Number(donorData.hemoglobin),
    last_donation: donorData.lastDonation || null,
    latitude: donorData.latitude,
    longitude: donorData.longitude,
    status: "active",
  };

  const created = await createDonor(record);
  return toDonorDto(created);
};
