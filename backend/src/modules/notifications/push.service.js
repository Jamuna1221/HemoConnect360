import fs from "node:fs";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { env } from "../../config/env.js";
import supabaseAdmin from "../../config/supabaseAdmin.js";

let messaging = null;

/**
 * Persist real in-app notifications to the existing `notifications` table.
 *
 * This is intentionally independent from Firebase Cloud Messaging: the row is
 * the Requester's source of truth in the notification UI, so it must be saved
 * even when FCM push is not initialized. The admin (service-role) client
 * bypasses RLS and is the same client the requester notification endpoints
 * already use to read these rows.
 */
const createNotifications = async (rows) => {
  if (!supabaseAdmin || rows.length === 0) return;
  const { error } = await supabaseAdmin.from("notifications").insert(rows);
  if (error) console.error("[push] In-app notification save failed", { error: error.message });
};

const initializePush = () => {
  if (messaging) return true;
  if (!env.firebaseServiceAccountPath) {
    console.warn("[push] FIREBASE_SERVICE_ACCOUNT_PATH is missing; push disabled (in-app notifications still saved)");
    return false;
  }
  if (!fs.existsSync(env.firebaseServiceAccountPath)) {
    console.warn("[push] Firebase service-account file was not found; push disabled (in-app notifications still saved)");
    return false;
  }

  const serviceAccount = JSON.parse(fs.readFileSync(env.firebaseServiceAccountPath, "utf8"));
  const app = getApps()[0] || initializeApp({ credential: cert(serviceAccount) });
  messaging = getMessaging(app);
  console.info("[push] Firebase Admin messaging initialized");
  return true;
};

export const notifyDonorsOfRequest = async ({ donorIds, bloodGroup, hospitalName }) => {
  try {
    if (!supabaseAdmin || donorIds.length === 0) return;
    const pushReady = initializePush();

    const { data: tokenRows, error } = await supabaseAdmin
      .from("donor_push_tokens")
      .select("donor_id, token")
      .in("donor_id", donorIds);

    if (error) throw error;
    const tokens = (tokenRows || []).map((row) => row.token);
    console.info("[push] Donor notification recipients", { donorCount: donorIds.length, tokenCount: tokens.length });
    await createNotifications(donorIds.map((donorId) => ({
      recipient_type: "donor",
      recipient_id: donorId,
      request_id: null,
      type: "blood_request",
      title: "New eligible blood request",
      message: `${bloodGroup} blood is needed at ${hospitalName}.`,
    })));
    if (!pushReady || tokens.length === 0) return;

    const result = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: "New blood request near you",
        body: `${bloodGroup} blood is needed at ${hospitalName}. Tap to view the request.`,
      },
      data: { type: "blood_request", bloodGroup, hospitalName },
    });

    const invalidTokens = result.responses
      .map((response, index) => response.success ? null : tokens[index])
      .filter(Boolean);
    console.info("[push] Donor notification result", {
      successCount: result.successCount,
      failureCount: result.failureCount,
    });
    if (invalidTokens.length > 0) {
      await supabaseAdmin.from("donor_push_tokens").delete().in("token", invalidTokens);
    }
  } catch (error) {
    console.error("[push] Donor notification failed", { error: error.message });
  }
};

export const notifyBloodBanksOfRequest = async ({ requestId, bloodGroup, hospitalName }) => {
  try {
    if (!supabaseAdmin || !requestId) return;

    // A verified blood bank is "relevant" when it has opted in to blood-request
    // notifications (blood_bank_settings.blood_request_notifications). Banks
    // without a settings row inherit the default (opted in). Distance is not
    // used: profiles may carry inaccurate coordinates (e.g. a bank whose city
    // is set but lat/lng are placeholder values), and banks opt in explicitly.
    const [{ data: banks, error: banksError }, { data: settings, error: settingsError }] =
      await Promise.all([
        supabaseAdmin
          .from("blood_banks")
          .select("id, user_id, blood_bank_name")
          .in("verification_status", ["APPROVED", "VERIFIED"]),
        supabaseAdmin
          .from("blood_bank_settings")
          .select("blood_bank_id, blood_request_notifications"),
      ]);
    if (banksError || settingsError) throw banksError || settingsError;

    const optedOut = new Set(
      (settings || [])
        .filter((setting) => setting.blood_request_notifications === false)
        .map((setting) => setting.blood_bank_id)
    );
    const relevant = (banks || []).filter((bank) => !optedOut.has(bank.id));
    if (relevant.length === 0) return;

    console.info("[push] Blood bank notification recipients", {
      requestId,
      bankCount: relevant.length,
    });
    await createNotifications(relevant.map((bank) => ({
      recipient_type: "blood_bank",
      recipient_id: bank.user_id,
      request_id: requestId,
      type: "blood_request",
      title: "New blood request",
      message: `${bloodGroup} blood is needed at ${hospitalName}.`,
    })));
  } catch (error) {
    console.error("[push] Blood bank notification failed", { error: error.message });
  }
};

export const notifyRequesterOfMatch = async ({ requesterId, donorCount, bloodGroup }) => {
  try {
    if (!supabaseAdmin) return;
    const pushReady = initializePush();

    const { data: tokenRows, error } = await supabaseAdmin
      .from("requester_push_tokens")
      .select("token")
      .eq("requester_id", requesterId);
    if (error) throw error;

    const tokens = (tokenRows || []).map((row) => row.token);
    console.info("[push] Requester notification recipients", { requesterId, tokenCount: tokens.length });
    await createNotifications([{
      recipient_type: "requester",
      recipient_id: requesterId,
      request_id: null,
      type: "donors_matched",
      title: "Eligible donors found",
      message: `${donorCount} potentially compatible ${bloodGroup} donor${donorCount === 1 ? '' : 's'} notified.`,
    }]);
    if (!pushReady || tokens.length === 0) return;

    const result = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: "Donors found for your request",
        body: `${donorCount} potentially compatible ${bloodGroup} donor${donorCount === 1 ? '' : 's'} notified.`,
      },
      data: { type: "donors_matched", bloodGroup },
    });

    const invalidTokens = result.responses
      .map((response, index) => response.success ? null : tokens[index])
      .filter(Boolean);
    console.info("[push] Requester notification result", {
      successCount: result.successCount,
      failureCount: result.failureCount,
    });
    if (invalidTokens.length > 0) {
      await supabaseAdmin.from("requester_push_tokens").delete().in("token", invalidTokens);
    }
  } catch (error) {
    console.error("[push] Requester notification failed", { error: error.message });
  }
};

export const notifyRequesterOfOutcome = async ({ requestId, donated }) => {
  try {
    if (!supabaseAdmin) return;
    if (!initializePush()) return;

    const { data: request, error: requestError } = await supabaseAdmin
      .from("blood_requests")
      .select("requester_id, blood_group, hospital_name")
      .eq("id", requestId)
      .single();
    if (requestError) throw requestError;

    const { data: tokenRows, error } = await supabaseAdmin
      .from("requester_push_tokens")
      .select("token")
      .eq("requester_id", request.requester_id);
    if (error) throw error;
    const tokens = (tokenRows || []).map((row) => row.token);
    if (tokens.length === 0) return;

    const result = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: donated ? "Blood donation completed" : "Donor could not complete donation",
        body: donated
          ? `A donor confirmed donation for your ${request.blood_group} request.`
          : "An accepted donor could not complete the donation. Another donor can respond.",
      },
      data: { type: "donation_outcome", requestId, donated: String(donated) },
    });
    console.info("[push] Requester outcome notification result", {
      requestId,
      successCount: result.successCount,
      failureCount: result.failureCount,
    });
  } catch (error) {
    console.error("[push] Requester outcome notification failed", { error: error.message });
  }
};

const BLOOD_BANK_UPDATE_MESSAGES = {
  accepted: {
    type: "blood_bank_update",
    title: "Blood bank accepted your request",
    body: (request) => `Your blood request has been accepted by a Blood Bank. ${request.hospital_name} has reserved ${request.blood_group} for you.`,
  },
  rejected: {
    type: "blood_bank_update",
    title: "Blood bank could not fulfill your request",
    body: (request) => `Your ${request.blood_group} blood request was declined by ${request.hospital_name}.`,
  },
  completed: {
    type: "blood_bank_update",
    title: "Blood request completed",
    body: (request) => `Your ${request.blood_group} blood request has been completed.`,
  },
};

export const notifyRequesterOfBloodBankUpdate = async ({ requestId, status }) => {
  try {
    if (!supabaseAdmin) return;
    const pushReady = initializePush();

    const { data: request, error: requestError } = await supabaseAdmin
      .from("blood_requests")
      .select("requester_id, blood_group, hospital_name")
      .eq("id", requestId)
      .single();
    if (requestError || !request) throw requestError || new Error("Request not found");

    const message = BLOOD_BANK_UPDATE_MESSAGES[status];
    if (!message) return;

    const body = message.body(request);
    await createNotifications([{
      recipient_type: "requester",
      recipient_id: request.requester_id,
      request_id: requestId,
      type: message.type,
      title: message.title,
      message: body,
    }]);

    if (!pushReady) return;

    const { data: tokenRows, error } = await supabaseAdmin
      .from("requester_push_tokens")
      .select("token")
      .eq("requester_id", request.requester_id);
    if (error) throw error;
    const tokens = (tokenRows || []).map((row) => row.token);
    if (tokens.length === 0) return;

    const result = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: message.title,
        body,
      },
      data: { type: message.type, requestId, status },
    });

    const invalidTokens = result.responses
      .map((response, index) => response.success ? null : tokens[index])
      .filter(Boolean);
    console.info("[push] Blood bank update notification result", {
      requestId,
      status,
      successCount: result.successCount,
      failureCount: result.failureCount,
    });
    if (invalidTokens.length > 0) {
      await supabaseAdmin.from("requester_push_tokens").delete().in("token", invalidTokens);
    }
  } catch (error) {
    console.error("[push] Blood bank update notification failed", { error: error.message });
  }
};
