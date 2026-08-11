import { Router } from "express";
import { apiRoutes } from "../../config/apiRoutes.js";
import { supabaseAuth } from "../../middleware/supabaseAuth.js";
import { asyncHandler } from "../../shared/http/asyncHandler.js";
import {
  getBloodBankInventoryHandler,
  updateBloodBankInventoryHandler,
  getBloodBankInventoryHistoryHandler,
} from "./bloodBankInventory.controller.js";

const router = Router();

router.get(
  apiRoutes.bloodBanks.inventory,
  supabaseAuth,
  asyncHandler(getBloodBankInventoryHandler)
);

router.post(
  apiRoutes.bloodBanks.inventory,
  supabaseAuth,
  asyncHandler(updateBloodBankInventoryHandler)
);

router.get(
  apiRoutes.bloodBanks.inventoryHistory,
  supabaseAuth,
  asyncHandler(getBloodBankInventoryHistoryHandler)
);

export default router;
