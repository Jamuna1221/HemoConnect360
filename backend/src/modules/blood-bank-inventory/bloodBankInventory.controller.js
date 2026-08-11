import {
  getBloodBankInventory,
  updateBloodBankInventory,
  getBloodBankInventoryHistory,
} from "./bloodBankInventory.service.js";
import { validateInventoryAdjust } from "./bloodBankInventory.validation.js";

export const getBloodBankInventoryHandler = async (req, res) => {
  const data = await getBloodBankInventory({
    accessToken: req.accessToken,
    user: req.user,
  });

  res.json({ success: true, data });
};

export const updateBloodBankInventoryHandler = async (req, res) => {
  const input = validateInventoryAdjust(req.body);
  const data = await updateBloodBankInventory({
    accessToken: req.accessToken,
    user: req.user,
    input,
  });

  res.json({ success: true, data });
};

export const getBloodBankInventoryHistoryHandler = async (req, res) => {
  const limit = Number(req.query.limit || 20);
  const safeLimit = Number.isInteger(limit) ? Math.min(Math.max(limit, 1), 50) : 20;

  const data = await getBloodBankInventoryHistory({
    accessToken: req.accessToken,
    user: req.user,
    limit: safeLimit,
  });

  res.json({ success: true, data });
};
