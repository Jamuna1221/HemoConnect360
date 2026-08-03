import { registerDonor } from "./donor.service.js";
import { validateDonorRegistration } from "./donor.validation.js";

export const registerDonorHandler = async (req, res) => {
  const input = validateDonorRegistration(req.body);
  const donor = await registerDonor(input);

  res.status(201).json({ success: true, data: donor });
};
