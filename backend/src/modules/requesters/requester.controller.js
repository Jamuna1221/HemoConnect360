import {
  loginRequesterByPhone,
  getRequesterDetails,
  saveRequesterProfile,
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
