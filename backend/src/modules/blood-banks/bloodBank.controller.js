import {
  registerBloodBank,
  getBloodBankProfile,
  updateBloodBankProfile,
  getBloodBankSettings,
  updateBloodBankSettings,
  getAllBloodBanksForAdmin,
  verifyBloodBankForAdmin,
} from "./bloodBank.service.js";

import {
  validateBloodBankRegistration,
  validateBloodBankUpdate,
  validateBloodBankSettingsUpdate,
} from "./bloodBank.validation.js";

export const registerBloodBankHandler = async (req, res) => {
  const input = validateBloodBankRegistration(req.body, req.files);

  const bloodBank = await registerBloodBank({ input });

  res.status(201).json({
    success: true,
    message: "Blood bank registration submitted successfully.",
    data: bloodBank,
  });
};

export const getBloodBankProfileHandler = async (req, res) => {
  const profile = await getBloodBankProfile({
    accessToken: req.accessToken,
    user: req.user,
  });

  res.json({
    success: true,
    data: profile,
  });
};

export const updateBloodBankProfileHandler = async (req, res) => {
  const input = validateBloodBankUpdate(req.body);

  const profile = await updateBloodBankProfile({
    accessToken: req.accessToken,
    user: req.user,
    input,
  });

  res.json({
    success: true,
    message: "Blood bank profile updated successfully.",
    data: profile,
  });
};

export const getBloodBankSettingsHandler = async (req, res) => {
  const settings = await getBloodBankSettings({
    accessToken: req.accessToken,
    user: req.user,
  });

  res.json({
    success: true,
    data: settings,
  });
};

export const updateBloodBankSettingsHandler = async (req, res) => {
  const input = validateBloodBankSettingsUpdate(req.body);

  const settings = await updateBloodBankSettings({
    accessToken: req.accessToken,
    user: req.user,
    input,
  });

  res.json({
    success: true,
    message: "Blood bank settings saved successfully.",
    data: settings,
  });
};

export const getAllBloodBanksForAdminHandler = async (req, res) => {
  const bloodBanks = await getAllBloodBanksForAdmin();

  res.json({
    success: true,
    data: bloodBanks,
  });
};

export const verifyBloodBankForAdminHandler = async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const updatedBank = await verifyBloodBankForAdmin({
    id,
    status,
    notes,
  });

  res.json({
    success: true,
    message: `Blood bank verification updated to ${status}`,
    data: updatedBank,
  });
};