import {
  getOverview,
  getVerification,
  applyVerification,
  getSecurityFlags,
  applySecurityAction,
  getNotifications,
  readNotification,
  readAllNotifications,
  publishAnnouncement,
  getAuditLogs,
  getProfile,
  updateProfile,
} from "./admin.service.js";

export const getOverviewHandler = async (req, res) => {
  const data = await getOverview();
  res.json({ success: true, data });
};

export const getVerificationHandler = async (req, res) => {
  const data = await getVerification();
  res.json({ success: true, data });
};

export const applyVerificationHandler = async (req, res) => {
  const { type, id, reason } = req.body || {};
  let action = req.body.action;
  if (!action) {
    if (req.path.includes("approve")) action = "approve";
    else if (req.path.includes("reject")) action = "reject";
    else if (req.path.includes("reverify")) action = "reverify";
  }

  console.log("applyVerificationHandler debug:", { path: req.path, type, action, id, reason });

  const data = await applyVerification({
    type,
    id,
    action,
    reason,
    adminEmail: req.admin.email,
  });
  res.json({ success: true, data });
};

export const getSecurityHandler = async (req, res) => {
  const data = await getSecurityFlags();
  res.json({ success: true, data });
};

export const applySecurityActionHandler = async (req, res) => {
  const { id, action, note } = req.body || {};
  const data = await applySecurityAction({
    id,
    action,
    note,
    adminEmail: req.admin.email,
  });
  res.json({ success: true, data });
};

export const getNotificationsHandler = async (req, res) => {
  const data = await getNotifications();
  res.json({ success: true, data });
};

export const readNotificationHandler = async (req, res) => {
  const { id } = req.body || {};
  const data = await readNotification(id);
  res.json({ success: true, data });
};

export const readAllNotificationsHandler = async (req, res) => {
  const data = await readAllNotifications();
  res.json({ success: true, data });
};

export const publishAnnouncementHandler = async (req, res) => {
  const { title, message, audience, priority } = req.body || {};
  const data = await publishAnnouncement({
    title,
    message,
    audience,
    priority,
    adminEmail: req.admin.email,
  });
  res.status(201).json({ success: true, data });
};

export const getAuditLogsHandler = async (req, res) => {
  const data = await getAuditLogs();
  res.json({ success: true, data });
};

export const getProfileHandler = async (req, res) => {
  const data = await getProfile({ adminEmail: req.admin.email });
  res.json({ success: true, data });
};

export const updateProfileHandler = async (req, res) => {
  const data = await updateProfile({
    adminEmail: req.admin.email,
    input: req.body || {},
  });
  res.json({ success: true, data });
};
