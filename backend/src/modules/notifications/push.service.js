import fs from "node:fs";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { createClient } from "@supabase/supabase-js";
import { env } from "../../config/env.js";

let messaging = null;
let adminSupabase = null;

const createNotifications = async (rows) => {
  if (!adminSupabase || rows.length === 0) return;
  const { error } = await adminSupabase.from("notifications").insert(rows);
  if (error) console.error("[push] In-app notification save failed", { error: error.message });
};

const initializePush = () => {
  if (messaging) return true;
  if (!env.firebaseServiceAccountPath) {
    console.warn("[push] FIREBASE_SERVICE_ACCOUNT_PATH is missing; notifications disabled");
    return false;
  }
  if (!env.supabaseServiceRoleKey) {
    console.warn("[push] SUPABASE_SERVICE_ROLE_KEY is missing; notifications disabled");
    return false;
  }

  if (!fs.existsSync(env.firebaseServiceAccountPath)) {
    console.warn("[push] Firebase service-account file was not found; notifications disabled");
    return false;
  }

  const serviceAccount = JSON.parse(fs.readFileSync(env.firebaseServiceAccountPath, "utf8"));
  const app = getApps()[0] || initializeApp({ credential: cert(serviceAccount) });
  messaging = getMessaging(app);
  adminSupabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  console.info("[push] Firebase Admin messaging initialized");
  return true;
};

export const notifyDonorsOfRequest = async ({ donorIds, bloodGroup, hospitalName }) => {
  try {
    if (!initializePush() || donorIds.length === 0) return;

    const { data: tokenRows, error } = await adminSupabase
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
    if (tokens.length === 0) return;

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
      await adminSupabase.from("donor_push_tokens").delete().in("token", invalidTokens);
    }
  } catch (error) {
    console.error("[push] Donor notification failed", { error: error.message });
  }
};

export const notifyRequesterOfMatch = async ({ requesterId, donorCount, bloodGroup }) => {
  try {
    if (!initializePush()) return;

    const { data: tokenRows, error } = await adminSupabase
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
    if (tokens.length === 0) return;

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
      await adminSupabase.from("requester_push_tokens").delete().in("token", invalidTokens);
    }
  } catch (error) {
    console.error("[push] Requester notification failed", { error: error.message });
  }
};

export const notifyRequesterOfOutcome = async ({ requestId, donated }) => {
  try {
    if (!initializePush()) return;
    const { data: request, error: requestError } = await adminSupabase
      .from("blood_requests")
      .select("requester_id, blood_group, hospital_name")
      .eq("id", requestId)
      .single();
    if (requestError) throw requestError;

    const { data: tokenRows, error } = await adminSupabase
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
