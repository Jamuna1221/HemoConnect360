import {
  loginRequesterByPhone,
  getRequesterDetails,
  saveRequesterProfile,
  registerRequesterPushToken,
  getRequesterNotifications,
  markRequesterNotificationRead,
} from "./requester.service.js";
import {
  validatePhoneLogin,
  validateProfileUpdate,
} from "./requester.validation.js";

export const phoneLogin = async (req, res) => {
  const input = validatePhoneLogin(req.body);
  const account = await loginRequesterByPhone(input.phone);

  res.status(account.isNew ? 201 : 200).json({ success: true, data: account });
};

export const getRequesterAccount = async (req, res) => {
  const account = await getRequesterDetails(req.requester.sub);

  res.json({ success: true, data: account });
};

export const updateRequesterProfile = async (req, res) => {
  const input = validateProfileUpdate(req.body);
  const account = await saveRequesterProfile(req.requester.sub, input);

  res.json({ success: true, data: account });
};

export const registerPushToken = async (req, res) => {
  const token = String(req.body?.token || "").trim();
  if (!token) return res.status(400).json({ success: false, message: "Push token is required" });
  const saved = await registerRequesterPushToken(req.requester.sub, token);
  res.json({ success: true, data: saved });
};

export const getNotifications = async (req, res) => {
  const data = await getRequesterNotifications(req.requester.sub);
  res.json({ success: true, data });
};

export const markNotificationRead = async (req, res) => {
  await markRequesterNotificationRead(req.requester.sub, req.params.id);
  res.json({ success: true });
};
