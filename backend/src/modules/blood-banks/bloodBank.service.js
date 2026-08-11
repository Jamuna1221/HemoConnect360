import { createClient } from "@supabase/supabase-js";
import { ApiError } from "../../shared/http/ApiError.js";
import { createAdminClient, createUserClient } from "../../config/supabase.js";
import { env } from "../../config/env.js";
import {
  findBloodBankByUserId,
  getBloodBankRegistrationConflicts,
  uploadBloodBankDocument,
  removeBloodBankDocuments,
  insertBloodBank,
} from "./bloodBank.repository.js";

const PENDING_VERIFICATION = "PENDING_VERIFICATION";

const toBloodBankDto = (row) => ({
  id: row.id,
  bloodBankName: row.blood_bank_name,
  registrationNumber: row.registration_number,
  bloodBankType: row.blood_bank_type,
  establishedYear: row.established_year,
  officialEmail: row.official_email,
  primaryPhone: row.primary_phone,
  alternatePhone: row.alternate_phone,
  addressLine: row.address_line,
  city: row.city,
  district: row.district,
  state: row.state,
  pincode: row.pincode,
  latitude: row.latitude,
  longitude: row.longitude,
  authorizedPersonName: row.authorized_person_name,
  designation: row.designation,
  authorizedPersonPhone: row.authorized_person_phone,
  authorizedPersonEmail: row.authorized_person_email,
  verificationStatus: row.verification_status,
  hasLicenseDocument: Boolean(row.license_doc_path),
  hasAuthorizationDocument: Boolean(row.authorization_doc_path),
  licenseDocPath: row.license_doc_path,
  authorizationDocPath: row.authorization_doc_path,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toAuthUserMetadata = (input) => ({
  bloodBank: true,
  name: input.bloodBankName,
  registrationNumber: input.registrationNumber,
  bloodBankType: input.bloodBankType,
  officialEmail: input.officialEmail,
  primaryPhone: input.primaryPhone,
  city: input.city,
  state: input.state,
});

const isUserAlreadyRegisteredError = (error) => {
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();
  return (
    code === "user_already_exists" ||
    message.includes("already registered") ||
    message.includes("already been registered")
  );
};

/**
 * Create (or reuse) the Supabase Auth account for a blood bank registration.
 *
 * The account is always created with email_confirm: true through the Admin API,
 * so the user can sign in immediately even when the global "Confirm email"
 * setting is enabled. The service-role key is used only here, server-side, and
 * is never exposed to the frontend.
 *
 * If the email is already registered, the supplied password is verified against
 * the existing account with the anon key; only the account owner can complete
 * the registration. The existing account is force-confirmed as well.
 */
const getOrCreateAuthUser = async ({ email, password, metadata }) => {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });

  if (!error && data?.user?.id) {
    return data.user;
  }

  if (isUserAlreadyRegisteredError(error)) {
    const verifyClient = createClient(env.supabaseUrl, env.supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { data: signIn, error: signInError } =
      await verifyClient.auth.signInWithPassword({ email, password });

    if (signInError || !signIn?.user?.id) {
      throw new ApiError(
        409,
        "An account with this email already exists. Please sign in instead."
      );
    }

    await adminClient.auth.admin.updateUserById(signIn.user.id, {
      email_confirm: true,
    });

    return signIn.user;
  }

  throw new ApiError(500, "Unable to create the account", error.message);
};

/**
 * Register a blood bank.
 *
 * The Auth account is created server-side with email_confirm: true (Admin API),
 * so registration never depends on the "Confirm email" setting. The user id
 * comes from the created/verified account - never from the client. Documents
 * are uploaded to Supabase Storage first and the profile row is inserted last
 * so a failed insert triggers cleanup of the uploaded files; a failed upload
 * never leaves an incomplete registration.
 *
 * The stored verification status is always PENDING_VERIFICATION - client input
 * is never used for it.
 */
export const registerBloodBank = async ({ input }) => {
  const adminClient = createAdminClient();

  const conflicts = await getBloodBankRegistrationConflicts(
    adminClient,
    input.registrationNumber,
    input.officialEmail
  );
  if (conflicts.registrationNumberTaken) {
    throw new ApiError(
      409,
      "A blood bank with this registration number is already registered"
    );
  }
  if (conflicts.officialEmailTaken) {
    throw new ApiError(
      409,
      "A blood bank with this official email is already registered"
    );
  }

  const authUser = await getOrCreateAuthUser({
    email: input.officialEmail,
    password: input.password,
    metadata: toAuthUserMetadata(input),
  });

  const existing = await findBloodBankByUserId(adminClient, authUser.id);
  if (existing) {
    throw new ApiError(409, "You already have a blood bank profile registered");
  }

  const licensePath = await uploadBloodBankDocument(
    adminClient,
    authUser.id,
    input.licenseDoc,
    "license"
  );

  let authorizationPath = null;
  try {
    authorizationPath = await uploadBloodBankDocument(
      adminClient,
      authUser.id,
      input.authorizationDoc,
      "authorization"
    );
  } catch (err) {
    await removeBloodBankDocuments(adminClient, [licensePath]);
    throw err;
  }

  try {
    const record = {
      user_id: authUser.id,
      blood_bank_name: input.bloodBankName,
      registration_number: input.registrationNumber,
      blood_bank_type: input.bloodBankType,
      established_year: input.establishedYear,
      official_email: input.officialEmail,
      primary_phone: input.primaryPhone,
      alternate_phone: input.alternatePhone,
      address_line: input.addressLine,
      city: input.city,
      district: input.district,
      state: input.state,
      pincode: input.pincode,
      latitude: input.latitude,
      longitude: input.longitude,
      authorized_person_name: input.authorizedPersonName,
      designation: input.designation,
      authorized_person_phone: input.authorizedPersonPhone,
      authorized_person_email: input.authorizedPersonEmail,
      license_doc_path: licensePath,
      authorization_doc_path: authorizationPath,
      verification_status: PENDING_VERIFICATION,
    };

    const created = await insertBloodBank(adminClient, record);
    return toBloodBankDto(created);
  } catch (err) {
    await removeBloodBankDocuments(adminClient, [licensePath, authorizationPath]);
    throw err;
  }
};

export const getBloodBankProfile = async ({ accessToken, user }) => {
  const client = createUserClient(accessToken);
  const profile = await findBloodBankByUserId(client, user.id);

  if (!profile) {
    throw new ApiError(404, "Blood bank profile not found");
  }

  return toBloodBankDto(profile);
};

export const getAllBloodBanksForAdmin = async () => {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("blood_banks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new ApiError(500, "Unable to fetch blood banks list", error.message);
  }

  return (data || []).map(toBloodBankDto);
};

export const verifyBloodBankForAdmin = async ({ id, status, notes }) => {
  const adminClient = createAdminClient();
  
  const { error } = await adminClient.rpc("admin_verify_blood_bank", {
    p_bank_id: id,
    p_status: status,
    p_notes: notes || ""
  });

  if (error) {
    throw new ApiError(500, "Failed to verify blood bank in database", error.message);
  }

  const { data: updated, error: fetchErr } = await adminClient
    .from("blood_banks")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !updated) {
    throw new ApiError(404, "Blood bank not found after update");
  }

  return toBloodBankDto(updated);
};
