import { registerBloodBank, getBloodBankProfile, getAllBloodBanksForAdmin, verifyBloodBankForAdmin } from "./bloodBank.service.js";
import { validateBloodBankRegistration } from "./bloodBank.validation.js";

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

  res.json({ success: true, data: profile });
};

export const getAllBloodBanksForAdminHandler = async (req, res) => {
  const bloodBanks = await getAllBloodBanksForAdmin();
  res.json({ success: true, data: bloodBanks });
};

export const verifyBloodBankForAdminHandler = async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const updatedBank = await verifyBloodBankForAdmin({ id, status, notes });
  res.json({ success: true, message: `Blood bank verification updated to ${status}`, data: updatedBank });
};
