import { createAdminClient } from "../../config/supabase.js";
import { ApiError } from "../../shared/http/ApiError.js";
import {
  fetchAllDonors,
  fetchAllRequesters,
  fetchAllBloodRequests,
  fetchAllBloodBanks,
  fetchInventory,
  updateDonorVerification,
  updateRequesterVerification,
  setBloodBankVerification,
  updateDonorAccountStatus,
  updateRequesterAccountStatus,
  findAuthUserByEmail,
  insertNotification,
  insertNotificationsIgnoreConflicts,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  listSuspiciousActivity,
  upsertSuspiciousActivity,
  findSuspiciousActivityById,
  updateSuspiciousActivity,
  insertAuditLog,
  listAuditLogs,
  getAdminSettings,
  upsertAdminSettings,
} from "./admin.repository.js";

const VERIFICATION_STATUS = {
  donor: {
    approve: "verified",
    reject: "rejected",
    reverify: "reverification_required",
  },
  requester: {
    approve: "verified",
    reject: "rejected",
    reverify: "reverification_required",
  },
  blood_bank: {
    approve: "VERIFIED",
    reject: "REJECTED",
    reverify: "PENDING_VERIFICATION",
  },
};

const VERIFICATION_LABEL = {
  approve: "Verification Approved",
  reject: "Verification Rejected",
  reverify: "Re-verification Requested",
};

const formatDate = (value) =>
  value ? new Date(value).toISOString().slice(0, 10) : null;

/* â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const writeAudit = async (
  client,
  adminEmail,
  { action, category, target, description, status = "Success", previous, next }
) => {
  try {
    await insertAuditLog(client, {
      admin_email: adminEmail,
      action,
      action_category: category,
      target,
      description,
      status,
      previous_value: previous || null,
      new_value: next || null,
    });
  } catch (err) {
    if (isMissingTableError(err)) {
      console.warn("[admin] audit_logs table missing - audit record skipped:", action);
    } else {
      throw err;
    }
  }
};

const isMissingTableError = (err) => {
  const msg = String(err?.message || "");
  return (
    /relation .* does not exist/i.test(msg) ||
    /could not find the table/i.test(msg) ||
    /42P01/i.test(msg) ||
    /PGRST205/i.test(msg) ||
    false
  );
};

const toFlagRow = (flag) => ({
  id: flag.id || `flag-${flag.sourceKey}`,
  source_key: flag.sourceKey || flag.source_key,
  user_type: flag.userType || flag.user_type,
  user_id: flag.userId || flag.user_id,
  user_name: flag.userName || flag.user_name,
  user_email: flag.userEmail || flag.user_email,
  activity_type: flag.activityType || flag.activity_type,
  reason_flagged: flag.reasonFlagged || flag.reason_flagged,
  risk_level: flag.riskLevel || flag.risk_level,
  status: flag.status || "FLAGGED",
  details: flag.details || null,
  admin_action: flag.adminAction || flag.admin_action || null,
  admin_note: flag.adminNote || flag.admin_note || null,
  created_by: flag.createdBy || flag.created_by || null,
});

const safeNotify = async (client, notification) => {
  try {
    return await insertNotification(client, notification);
  } catch (err) {
    if (isMissingTableError(err)) {
      console.warn("[admin] admin_notifications table missing - notification skipped:", notification.title);
      return null;
    }
    throw err;
  }
};

const safeNotifyBulk = async (client, notifications) => {
  try {
    await insertNotificationsIgnoreConflicts(client, notifications);
  } catch (err) {
    if (isMissingTableError(err)) {
      console.warn(
        "[admin] admin_notifications table missing - skipped",
        notifications.length,
        "system notification(s)"
      );
    } else {
      throw err;
    }
  }
};

const loadSecurityData = async (client) => {
  const [donors, requesters, requests, bloodBanks] = await Promise.all([
    fetchAllDonors(client),
    fetchAllRequesters(client),
    fetchAllBloodRequests(client),
    fetchAllBloodBanks(client),
  ]);
  return { donors, requesters, requests, bloodBanks };
};

const findComputedFlagById = async (client, id) => {
  const { donors, requesters, requests, bloodBanks } = await loadSecurityData(client);
  const computed = computeFlags(donors, requesters, requests, bloodBanks);
  return computed.map((flag) => toFlagRow(flag)).find((row) => row.id === id) || null;
};

const resolveAdminUserId = async (client, adminEmail) => {
  try {
    const user = await findAuthUserByEmail(client, adminEmail);
    return user?.id || null;
  } catch {
    return null;
  }
};

/* â”€â”€ Overview (dashboard + reports data) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export const getOverview = async () => {
  const client = createAdminClient();

  const [donors, requesters, requests, bloodBanks, inventory] =
    await Promise.all([
      fetchAllDonors(client),
      fetchAllRequesters(client),
      fetchAllBloodRequests(client),
      fetchAllBloodBanks(client),
      fetchInventory(client),
    ]);

  const banksById = new Map(bloodBanks.map((b) => [b.id, b]));
  const requestCountByRequester = {};
  requests.forEach((r) => {
    if (r.requester_id) {
      requestCountByRequester[r.requester_id] =
        (requestCountByRequester[r.requester_id] || 0) + 1;
    }
  });

  const stockByBank = new Map();
  inventory.forEach((row) => {
    if (!stockByBank.has(row.blood_bank_id)) {
      stockByBank.set(row.blood_bank_id, {});
    }
    stockByBank.get(row.blood_bank_id)[row.blood_group] = row.units_available;
  });

  const availableUnitsByBank = {};
  let totalAvailableUnits = 0;
  const inventorySummary = {};
  stockByBank.forEach((groups, bankId) => {
    let sum = 0;
    Object.entries(groups).forEach(([group, qty]) => {
      sum += qty;
      inventorySummary[group] = (inventorySummary[group] || 0) + qty;
    });
    availableUnitsByBank[bankId] = sum;
    totalAvailableUnits += sum;
  });

  return {
    donors: donors.map((d) => ({
      id: d.id,
      fullName: d.full_name || "Anonymous Donor",
      bloodGroup: d.blood_group,
      phone: d.phone,
      city: d.city,
      email: d.email || "",
      status: d.status || "active",
      verificationStatus: d.verification_status || "pending",
      createdAt: formatDate(d.created_at),
    })),
    requesters: requesters.map((r) => ({
      id: r.id,
      fullName: r.full_name || "Anonymous Requester",
      phone: r.phone,
      city: r.city || "N/A",
      email: r.email || "",
      activeRequests: requestCountByRequester[r.id] || 0,
      status: r.account_status || "active",
      verificationStatus: r.verification_status || "pending",
      createdAt: formatDate(r.created_at),
    })),
    requests: requests.map((r) => ({
      id: r.id,
      requesterId: r.requester_id,
      patientName: r.patient_name || "Anonymous",
      bloodGroup: r.blood_group,
      units: r.units_required,
      city: r.city,
      status: r.status,
      priority: r.priority || "normal",
      hospitalName: r.hospital_name || "N/A",
      createdAt: r.created_at,
    })),
    bloodBanks: bloodBanks.map((b) => {
      const groups = stockByBank.get(b.id) || {};
      const stock = [
        "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-",
      ].map((group) => ({ group, available: groups[group] || 0, reserved: 0 }));
      return {
        id: b.id,
        name: b.blood_bank_name,
        city: b.city,
        phone: b.primary_phone,
        email: b.official_email,
        verificationStatus: b.verification_status,
        availableUnits: availableUnitsByBank[b.id] || 0,
        accountStatus: b.account_status || "active",
        registrationNumber: b.registration_number,
        stock,
        licenseDocPath: b.license_doc_path,
        authorizationDocPath: b.authorization_doc_path,
        createdAt: formatDate(b.created_at),
      };
    }),
    inventorySummary,
    totalAvailableUnits,
  };
};

/* â”€â”€ Verification center â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export const getVerification = async () => {
  const client = createAdminClient();

  const [donors, requesters, bloodBanks] = await Promise.all([
    fetchAllDonors(client),
    fetchAllRequesters(client),
    fetchAllBloodBanks(client),
  ]);

  const documents = [];
  donors.forEach((d) => {
    if (d.id_proof) {
      documents.push({
        id: `doc-donor-${d.id}`,
        ownerId: d.id,
        owner: d.full_name || "Donor",
        ownerType: "Donor",
        documentType: "ID Proof",
        documentUrl: d.id_proof,
        documentPath: d.id_proof,
        bucket: "donor-docs",
        submittedAt: formatDate(d.created_at),
        status: d.verification_status || "pending",
      });
    }
  });
  bloodBanks.forEach((b) => {
    if (b.license_doc_path) {
      documents.push({
        id: `doc-bank-license-${b.id}`,
        ownerId: b.id,
        owner: b.blood_bank_name,
        ownerType: "Blood Bank",
        documentType: "License",
        documentPath: b.license_doc_path,
        bucket: "blood-bank-docs",
        submittedAt: formatDate(b.created_at),
        status: b.verification_status || "PENDING_VERIFICATION",
      });
    }
    if (b.authorization_doc_path) {
      documents.push({
        id: `doc-bank-auth-${b.id}`,
        ownerId: b.id,
        owner: b.blood_bank_name,
        ownerType: "Blood Bank",
        documentType: "Authorization",
        documentPath: b.authorization_doc_path,
        bucket: "blood-bank-docs",
        submittedAt: formatDate(b.created_at),
        status: b.verification_status || "PENDING_VERIFICATION",
      });
    }
  });

  return {
    donors: donors.map((d) => ({
      id: d.id,
      donorName: d.full_name || "Anonymous Donor",
      email: d.email || "",
      bloodGroup: d.blood_group,
      location: d.city || "N/A",
      registrationDate: formatDate(d.created_at),
      documentType: d.id_proof ? "ID Proof" : "None",
      documentUrl: d.id_proof,
      status: d.verification_status || "pending",
      submittedDate: formatDate(d.created_at),
      verifiedAt: d.verified_at ? new Date(d.verified_at).toISOString() : null,
      notes: d.verification_notes,
    })),
    requesters: requesters.map((r) => ({
      id: r.id,
      requesterName: r.full_name || "Anonymous Requester",
      email: r.email || "",
      location: r.city || "N/A",
      organization: r.blood_needed_for || "",
      registrationDate: formatDate(r.created_at),
      status: r.verification_status || "pending",
      submittedDate: formatDate(r.created_at),
      verifiedAt: r.verified_at ? new Date(r.verified_at).toISOString() : null,
      notes: r.verification_notes,
    })),
    bloodBanks: bloodBanks.map((b) => ({
      id: b.id,
      bankName: b.blood_bank_name,
      location: `${b.city || ""}${b.state ? `, ${b.state}` : ""}`,
      contact: b.primary_phone,
      email: b.official_email,
      registrationNumber: b.registration_number,
      status: b.verification_status,
      submittedDate: formatDate(b.created_at),
      verifiedAt: b.verified_at ? new Date(b.verified_at).toISOString() : null,
      notes: b.verification_notes,
      licenseDocPath: b.license_doc_path,
      authorizationDocPath: b.authorization_doc_path,
    })),
    documents,
  };
};

export const applyVerification = async ({ type, id, action, reason, adminEmail }) => {
  const client = createAdminClient();
  const statusMap = VERIFICATION_STATUS[type];
  if (!statusMap || !statusMap[action]) {
    throw new ApiError(400, "Invalid verification type or action");
  }
  if (action === "reject" || action === "reverify") {
    if (!reason || !String(reason).trim()) {
      throw new ApiError(400, `${action === "reject" ? "Rejection" : "Re-verification"} reason is required`);
    }
  }

  const adminUserId = await resolveAdminUserId(client, adminEmail);
  let target = "";
  const newStatus = statusMap[action];

  if (type === "donor") {
    const donors = await fetchAllDonors(client);
    const donor = donors.find((d) => d.id === id);
    if (!donor) throw new ApiError(404, "Donor not found");
    target = donor.full_name || donor.id;
    await updateDonorVerification(client, id, newStatus, reason || null, adminUserId);
  } else if (type === "requester") {
    const requesters = await fetchAllRequesters(client);
    const requester = requesters.find((r) => r.id === id);
    if (!requester) throw new ApiError(404, "Requester not found");
    target = requester.full_name || requester.id;
    await updateRequesterVerification(client, id, newStatus, reason || null, adminUserId);
  } else if (type === "blood_bank") {
    const banks = await fetchAllBloodBanks(client);
    const bank = banks.find((b) => b.id === id);
    if (!bank) throw new ApiError(404, "Blood bank not found");
    target = bank.blood_bank_name;
    await setBloodBankVerification(
      client,
      id,
      newStatus,
      reason || null,
      adminUserId
    );
  } else {
    throw new ApiError(400, "Invalid verification type");
  }

  await writeAudit(client, adminEmail, {
    action: VERIFICATION_LABEL[action],
    category: "Verification",
    target,
    description: `${VERIFICATION_LABEL[action]} for ${type.replace("_", " ")}: ${target}${
      reason ? ` - ${reason}` : ""
    }`,
    previous: "pending",
    next: newStatus,
  });

  await safeNotify(client, {
    type: "VERIFICATION",
    title: `${VERIFICATION_LABEL[action]}: ${target}`,
    description: `${VERIFICATION_LABEL[action]} for ${type.replace("_", " ")} ${target}`,
    priority: action === "reject" ? "important" : "normal",
    audience: "all",
  });

  return { type, id, status: newStatus };
};

/* â”€â”€ Security / suspicious activity â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const computeFlags = (donors, requesters, requests, bloodBanks) => {
  const flags = [];

  const addFlag = (flag) => flags.push(flag);

  const cancelledByRequester = {};
  requests.forEach((r) => {
    if (r.status === "cancelled" && r.requester_id) {
      cancelledByRequester[r.requester_id] =
        (cancelledByRequester[r.requester_id] || 0) + 1;
    }
  });
  requesters.forEach((req) => {
    const count = cancelledByRequester[req.id] || 0;
    if (count >= 2) {
      addFlag({
        sourceKey: `repeated-cancellations:${req.id}`,
        userType: "requester",
        userId: req.id,
        userName: req.full_name || "Requester",
        userEmail: req.email,
        activityType: "Repeated Cancellations",
        reasonFlagged: `Cancelled ${count} blood requests`,
        riskLevel: count >= 4 ? "high" : "medium",
        details: { cancelledCount: count },
      });
    }
  });

  const requestCounts = {};
  requests.forEach((r) => {
    if (r.requester_id) {
      requestCounts[r.requester_id] = (requestCounts[r.requester_id] || 0) + 1;
    }
  });
  requesters.forEach((req) => {
    const count = requestCounts[req.id] || 0;
    if (count >= 3) {
      addFlag({
        sourceKey: `multiple-requests:${req.id}`,
        userType: "requester",
        userId: req.id,
        userName: req.full_name || "Requester",
        userEmail: req.email,
        activityType: "Multiple Requests",
        reasonFlagged: `Submitted ${count} blood requests`,
        riskLevel: count >= 6 ? "high" : "medium",
        details: { requestCount: count },
      });
    }
  });

  const perDay = {};
  requests.forEach((r) => {
    if (!r.requester_id || !r.created_at) return;
    const day = r.created_at.slice(0, 10);
    perDay[`${r.requester_id}:${day}`] = (perDay[`${r.requester_id}:${day}`] || 0) + 1;
  });
  requesters.forEach((req) => {
    let maxCount = 0;
    Object.entries(perDay).forEach(([key, count]) => {
      if (key.startsWith(`${req.id}:`) && count > maxCount) maxCount = count;
    });
    if (maxCount >= 3) {
      addFlag({
        sourceKey: `unusual-frequency:${req.id}`,
        userType: "requester",
        userId: req.id,
        userName: req.full_name || "Requester",
        userEmail: req.email,
        activityType: "Unusual Request Frequency",
        reasonFlagged: `${maxCount} requests created on a single day`,
        riskLevel: "medium",
        details: { maxPerDay: maxCount },
      });
    }
  });

  bloodBanks.forEach((b) => {
    if (b.verification_status === "REJECTED") {
      addFlag({
        sourceKey: `invalid-document:bank:${b.id}`,
        userType: "blood_bank",
        userId: b.id,
        userName: b.blood_bank_name,
        userEmail: b.official_email,
        activityType: "Invalid Document",
        reasonFlagged: b.verification_notes || "Submitted verification documents were rejected",
        riskLevel: "high",
        details: { verificationStatus: b.verification_status },
      });
    }
  });

  donors.forEach((d) => {
    if (d.verification_status === "rejected") {
      addFlag({
        sourceKey: `invalid-document:donor:${d.id}`,
        userType: "donor",
        userId: d.id,
        userName: d.full_name,
        userEmail: d.email,
        activityType: "Invalid Document",
        reasonFlagged: d.verification_notes || "Submitted identity documents were rejected",
        riskLevel: "high",
        details: { verificationStatus: d.verification_status },
      });
    }
  });

  const emailOwnerCount = new Map();
  donors.forEach((d) => {
    if (!d.email) return;
    const key = d.email.toLowerCase();
    emailOwnerCount.set(key, (emailOwnerCount.get(key) || 0) + 1);
  });
  requesters.forEach((r) => {
    if (!r.email) return;
    const key = r.email.toLowerCase();
    emailOwnerCount.set(key, (emailOwnerCount.get(key) || 0) + 1);
  });
  bloodBanks.forEach((b) => {
    if (!b.official_email) return;
    const key = b.official_email.toLowerCase();
    emailOwnerCount.set(key, (emailOwnerCount.get(key) || 0) + 1);
  });
  const seenEmails = new Set();
  const flagDuplicate = (userType, userId, userName, userEmail) => {
    if (!userEmail || seenEmails.has(userEmail.toLowerCase())) return;
    seenEmails.add(userEmail.toLowerCase());
    const key = userEmail.toLowerCase();
    if ((emailOwnerCount.get(key) || 0) > 1) {
      addFlag({
        sourceKey: `duplicate-account:${userEmail.toLowerCase()}`,
        userType,
        userId,
        userName,
        userEmail,
        activityType: "Duplicate Account",
        reasonFlagged: "The same email address is registered on multiple accounts",
        riskLevel: "low",
        details: { email: userEmail },
      });
    }
  };
  donors.forEach((d) => flagDuplicate("donor", d.id, d.full_name, d.email));
  requesters.forEach((r) => flagDuplicate("requester", r.id, r.full_name, r.email));
  bloodBanks.forEach((b) =>
    flagDuplicate("blood_bank", b.id, b.blood_bank_name, b.official_email)
  );

  return flags;
};

export const getSecurityFlags = async () => {
  const client = createAdminClient();

  const [donors, requesters, requests, bloodBanks] = await Promise.all([
    fetchAllDonors(client),
    fetchAllRequesters(client),
    fetchAllBloodRequests(client),
    fetchAllBloodBanks(client),
  ]);

  const computed = computeFlags(donors, requesters, requests, bloodBanks);
  const computedRows = computed.map((flag) => toFlagRow(flag));

  let persisted = [];
  let canPersist = true;
  try {
    persisted = await listSuspiciousActivity(client);
  } catch (err) {
    if (isMissingTableError(err)) {
      canPersist = false;
      console.warn(
        "[admin] suspicious_activity table missing - security flags computed on the fly. Apply the admin-control-panel migration to persist review actions."
      );
    } else {
      throw err;
    }
  }

  const persistedByKey = new Map(persisted.map((p) => [p.source_key, p]));

  const upserted = [];
  if (canPersist) {
    for (const row of computedRows) {
      const existing = persistedByKey.get(row.source_key);
      const saved = await upsertSuspiciousActivity(client, {
        ...row,
        status: existing?.status || row.status,
        admin_action: existing?.admin_action || null,
        admin_note: existing?.admin_note || null,
        created_by: existing?.created_by || null,
      });
      upserted.push(saved);
    }
  }

  const allFlags = canPersist
    ? [
        ...upserted,
        ...persisted.filter((p) => !computedRows.some((c) => c.source_key === p.source_key)),
      ]
    : computedRows;

  const byId = new Map(allFlags.map((f) => [f.id, f]));
  const donorsById = new Map(donors.map((d) => [d.id, d]));
  const requestersById = new Map(requesters.map((r) => [r.id, r]));
  const banksById = new Map(bloodBanks.map((b) => [b.id, b]));

  return allFlags
    .map((f) => {
      const userType = f.userType || f.user_type;
      const userId = f.userId || f.user_id;
      const related = { requests: [], cancellations: [], verificationStatus: null };
      if (userType === "donor" || userType === "requester") {
        const userRequests = requests.filter((r) => r.requester_id === userId);
        related.requests = userRequests.slice(0, 5).map((r) => ({
          id: r.id,
          patientName: r.patient_name,
          bloodGroup: r.blood_group,
          status: r.status,
          createdAt: formatDate(r.created_at),
        }));
        related.cancellations = userRequests.filter((r) => r.status === "cancelled").length;
      }
      if (userType === "donor") {
        const d = donorsById.get(userId);
        related.verificationStatus = d?.verification_status || null;
      }
      if (userType === "requester") {
        const r = requestersById.get(userId);
        related.verificationStatus = r?.verification_status || null;
      }
      if (userType === "blood_bank") {
        const b = banksById.get(userId);
        related.verificationStatus = b?.verification_status || null;
      }
      return {
        id: f.id,
        sourceKey: f.source_key,
        user: f.user_name,
        email: f.user_email || "",
        userType: f.user_type,
        userId: f.user_id,
        activityType: f.activity_type,
        reasonFlagged: f.reason_flagged,
        riskLevel: f.risk_level,
        status: f.status,
        details: f.details,
        adminAction: f.admin_action,
        adminNote: f.admin_note,
        createdAt: f.created_at,
        updatedAt: f.updated_at,
        related,
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const SECURITY_ACTIONS = {
  under_review: { status: "UNDER_REVIEW", label: "Marked Under Review" },
  warn: { status: "UNDER_REVIEW", label: "Warning Issued" },
  suspend: { status: "RESOLVED", label: "Account Suspended" },
  block: { status: "RESOLVED", label: "Account Blocked" },
  dismiss: { status: "DISMISSED", label: "Flag Dismissed" },
  resolve: { status: "RESOLVED", label: "Flag Resolved" },
};

export const applySecurityAction = async ({ id, action, note, adminEmail }) => {
  const client = createAdminClient();
  const definition = SECURITY_ACTIONS[action];
  if (!definition) throw new ApiError(400, "Invalid security action");

  if (action === "warn") {
    if (!note || !String(note).trim()) {
      throw new ApiError(400, "A warning note is required");
    }
  }

  let flag = null;
  let degraded = false;
  try {
    flag = await findSuspiciousActivityById(client, id);
  } catch (err) {
    if (isMissingTableError(err)) {
      degraded = true;
    } else {
      throw err;
    }
  }

  if (!flag) {
    const computed = await findComputedFlagById(client, id);
    if (!computed) throw new ApiError(404, "Suspicious activity flag not found");
    flag = computed;
    degraded = true;
  }

  const flagStatus = flag.status || "FLAGGED";
  const userName = flag.userName || flag.user_name || "User";
  const userType = flag.userType || flag.user_type;
  const userId = flag.userId || flag.user_id;
  const activityType = flag.activityType || flag.activity_type || "";
  let accountTarget = null;

  if (action === "suspend" || action === "block") {
    const status = action === "suspend" ? "suspended" : "blocked";
    if (userType === "donor") {
      await updateDonorAccountStatus(client, userId, status);
      accountTarget = "donor";
    } else if (userType === "requester") {
      await updateRequesterAccountStatus(client, userId, status);
      accountTarget = "requester";
    } else {
      throw new ApiError(
        400,
        `${action} is only supported for donor and requester accounts`
      );
    }
  }

  if (!degraded) {
    await updateSuspiciousActivity(client, id, {
      status: definition.status,
      admin_action: action,
      admin_note: note || null,
    });
  }

  const description =
    action === "warn" && note
      ? `Warning issued to ${userName} - ${note}`
      : `${definition.label} for ${userName} (${activityType})`;

  await writeAudit(client, adminEmail, {
    action: definition.label,
    category: "Security",
    target: userName,
    description,
    previous: flagStatus,
    next: definition.status,
  });

  await safeNotify(client, {
    type: "SECURITY",
    title: `${definition.label}: ${userName}`,
    description,
    priority: action === "suspend" || action === "block" ? "urgent" : "important",
    audience: "all",
  });

  return {
    id,
    status: definition.status,
    adminAction: action,
    accountTarget,
  };
};

/* â”€â”€ Notifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const syncSystemNotifications = async (client) => {
  const [donors, requesters, requests, bloodBanks] = await Promise.all([
    fetchAllDonors(client),
    fetchAllRequesters(client),
    fetchAllBloodRequests(client),
    fetchAllBloodBanks(client),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const toInsert = [];

  donors.forEach((d) => {
    if ((d.verification_status || "pending") === "pending") {
      toInsert.push({
        type: "VERIFICATION",
        title: `Verification pending: ${d.full_name}`,
        description: `Identity document verification is pending for donor ${d.full_name}.`,
        priority: "normal",
        audience: "all",
        source_key: `verification-donor:${d.id}`,
      });
    }
    if ((d.created_at || "").slice(0, 10) === today) {
      toInsert.push({
        type: "REGISTRATION",
        title: `New donor registration: ${d.full_name}`,
        description: `${d.full_name} (${d.blood_group}) registered today.`,
        priority: "normal",
        audience: "donors",
        source_key: `registration-donor:${d.id}`,
      });
    }
  });

  requesters.forEach((r) => {
    if ((r.created_at || "").slice(0, 10) === today) {
      toInsert.push({
        type: "REGISTRATION",
        title: `New requester registration: ${r.full_name}`,
        description: `${r.full_name} registered today.`,
        priority: "normal",
        audience: "requesters",
        source_key: `registration-requester:${r.id}`,
      });
    }
  });

  bloodBanks.forEach((b) => {
    if (b.verification_status === "PENDING_VERIFICATION") {
      toInsert.push({
        type: "VERIFICATION",
        title: `Blood bank verification pending: ${b.blood_bank_name}`,
        description: `License and authorization documents require review for ${b.blood_bank_name}.`,
        priority: "normal",
        audience: "blood_banks",
        source_key: `verification-bank:${b.id}`,
      });
    }
    if ((b.created_at || "").slice(0, 10) === today) {
      toInsert.push({
        type: "REGISTRATION",
        title: `New blood bank registration: ${b.blood_bank_name}`,
        description: `${b.blood_bank_name} registered today.`,
        priority: "normal",
        audience: "blood_banks",
        source_key: `registration-bank:${b.id}`,
      });
    }
  });

  const openStatuses = ["submitted", "approved", "notified", "searching_donors", "accepted"];
  requests.forEach((r) => {
    if (["urgent", "critical"].includes(r.priority) && openStatuses.includes(r.status)) {
      toInsert.push({
        type: "URGENT_REQUEST",
        title: `Urgent blood request: ${r.patient_name} (${r.blood_group})`,
        description: `${r.units_required} unit(s) of ${r.blood_group} required at ${r.hospital_name || "the hospital"}.`,
        priority: "urgent",
        audience: "all",
        source_key: `urgent-request:${r.id}`,
      });
    }
  });

  // Security-flag notifications are best-effort. They depend on the
  // suspicious_activity table, which must never block the notifications feed
  // (the feed is built from donors, requesters, blood requests and banks).
  try {
    const flags = await listSuspiciousActivity(client);
    flags.forEach((f) => {
      if (f.status === "FLAGGED") {
        toInsert.push({
          type: "SECURITY",
          title: `Security flag: ${f.activity_type} - ${f.user_name}`,
          description: f.reason_flagged || "A suspicious activity flag requires review.",
          priority: f.risk_level === "high" ? "urgent" : "important",
          audience: "all",
          source_key: `security-flag:${f.id}`,
        });
      }
    });
  } catch (err) {
    console.warn("[admin] Security-flag notification sync skipped:", err.message);
  }

  await safeNotifyBulk(client, toInsert);
};

export const getNotifications = async () => {
  const client = createAdminClient();
  try {
    await syncSystemNotifications(client);
  } catch (err) {
    if (isMissingTableError(err)) {
      console.warn("[admin] admin_notifications table missing - returning empty notification feed");
    } else {
      throw err;
    }
  }
  let rows = [];
  try {
    rows = await listNotifications(client, 200);
  } catch (err) {
    if (isMissingTableError(err)) {
      rows = [];
    } else {
      throw err;
    }
  }
  return rows.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    description: n.description,
    priority: n.priority,
    audience: n.audience,
    isRead: n.is_read,
    readAt: n.read_at,
    createdAt: n.created_at,
  }));
};

export const readNotification = async (id) => {
  const client = createAdminClient();
  try {
    return await markNotificationRead(client, id);
  } catch (err) {
    if (isMissingTableError(err)) {
      throw new ApiError(404, "Notification not found");
    }
    throw err;
  }
};

export const readAllNotifications = async () => {
  const client = createAdminClient();
  try {
    return await markAllNotificationsRead(client);
  } catch (err) {
    if (isMissingTableError(err)) {
      return { success: true };
    }
    throw err;
  }
};

export const publishAnnouncement = async ({ title, message, audience, priority, adminEmail }) => {
  const client = createAdminClient();
  if (!title || !String(title).trim()) throw new ApiError(400, "Announcement title is required");
  if (!message || !String(message).trim()) throw new ApiError(400, "Announcement message is required");

  const allowedAudience = ["all", "donors", "requesters", "blood_banks"];
  const allowedPriority = ["normal", "important", "urgent"];
  if (!allowedAudience.includes(audience)) throw new ApiError(400, "Invalid audience");
  if (!allowedPriority.includes(priority)) throw new ApiError(400, "Invalid priority");

  const notification = await insertNotification(client, {
    type: "ANNOUNCEMENT",
    title: String(title).trim(),
    description: String(message).trim(),
    priority,
    audience,
    source_key: null,
  });

  await writeAudit(client, adminEmail, {
    action: "Announcement Created",
    category: "Notification",
    target: audience,
    description: `Published announcement "${title}" to ${audience} with ${priority} priority`,
    next: priority,
  });

  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    description: notification.description,
    priority: notification.priority,
    audience: notification.audience,
    createdAt: notification.created_at,
  };
};

/* â”€â”€ Audit logs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export const getAuditLogs = async () => {
  const client = createAdminClient();
  let rows = [];
  try {
    rows = await listAuditLogs(client, 300);
  } catch (err) {
    if (isMissingTableError(err)) {
      console.warn("[admin] audit_logs table missing - returning empty audit log");
      rows = [];
    } else {
      throw err;
    }
  }
  return rows.map((l) => ({
    id: l.id,
    admin: l.admin_email || "System",
    action: l.action,
    actionCategory: l.action_category || "System",
    target: l.target || "",
    description: l.description || "",
    previousValue: l.previous_value,
    newValue: l.new_value,
    status: l.status || "Success",
    createdAt: l.created_at,
  }));
};

/* â”€â”€ Profile / settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export const getProfile = async ({ adminEmail }) => {
  const client = createAdminClient();
  let settings = null;
  try {
    settings = await getAdminSettings(client);
  } catch (err) {
    if (!isMissingTableError(err)) throw err;
  }

  if (settings === null) {
    try {
      await upsertAdminSettings(client, {});
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
    }
  }

  const role = "Administrator";
  const accountStatus = "Active";
  const lastLogin = settings?.last_login || null;

  return {
    name: settings?.full_name || "System Admin",
    email: adminEmail,
    role,
    accountStatus,
    lastLogin,
    notificationPrefs: settings?.notification_prefs || {
      email: true,
      urgent: true,
      verification: true,
      security: true,
      system: true,
    },
    systemPrefs: settings?.system_prefs || {
      defaultTab: "dashboard",
      itemsPerPage: 20,
    },
  };
};

export const updateProfile = async ({ adminEmail, input }) => {
  const client = createAdminClient();

  let current = {};
  try {
    current = (await getAdminSettings(client)) || {};
  } catch (err) {
    if (!isMissingTableError(err)) throw err;
  }
  const currentPrefs = current.notification_prefs || {};
  const currentSystem = current.system_prefs || {};

  const notificationPrefs = {
    email: input.notificationPrefs?.email ?? currentPrefs.email ?? true,
    urgent: input.notificationPrefs?.urgent ?? currentPrefs.urgent ?? true,
    verification: input.notificationPrefs?.verification ?? currentPrefs.verification ?? true,
    security: input.notificationPrefs?.security ?? currentPrefs.security ?? true,
    system: input.notificationPrefs?.system ?? currentPrefs.system ?? true,
  };

  const systemPrefs = {
    defaultTab: input.systemPrefs?.defaultTab || currentSystem.defaultTab || "dashboard",
    itemsPerPage: Number(input.systemPrefs?.itemsPerPage || currentSystem.itemsPerPage || 20),
  };

  const name = input.name && String(input.name).trim() ? String(input.name).trim() : "System Admin";

  let saved;
  try {
    saved = await upsertAdminSettings(client, {
      full_name: name,
      notification_prefs: notificationPrefs,
      system_prefs: systemPrefs,
    });
  } catch (err) {
    if (isMissingTableError(err)) {
      saved = {
        full_name: name,
        notification_prefs: notificationPrefs,
        system_prefs: systemPrefs,
      };
    } else {
      throw err;
    }
  }

  await writeAudit(client, adminEmail, {
    action: "Profile Updated",
    category: "Profile",
    target: adminEmail,
    description: `Admin profile settings updated${name !== current.full_name ? ` (display name changed to ${name})` : ""}`,
  });

  return {
    name: saved.full_name,
    email: adminEmail,
    notificationPrefs: saved.notification_prefs,
    systemPrefs: saved.system_prefs,
  };
};

