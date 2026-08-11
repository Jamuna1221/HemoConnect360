import { Router } from "express";
import { apiRoutes } from "../../config/apiRoutes.js";
import { supabaseAuth } from "../../middleware/supabaseAuth.js";
import { asyncHandler } from "../../shared/http/asyncHandler.js";
import {
  getAvailableDonorsHandler,
  getDonorByPhoneHandler,
  getCollectionHistoryHandler,
  createBloodCollectionHandler,
} from "./bloodBankCollections.controller.js";

const router = Router();

router.get(
  apiRoutes.bloodBanks.collectionDonors,
  supabaseAuth,
  asyncHandler(getAvailableDonorsHandler)
);

router.get(
  apiRoutes.bloodBanks.collectionDonorDetails,
  supabaseAuth,
  asyncHandler(getDonorByPhoneHandler)
);

router.get(
  apiRoutes.bloodBanks.collectionHistory,
  supabaseAuth,
  asyncHandler(getCollectionHistoryHandler)
);

router.post(
  apiRoutes.bloodBanks.collections,
  supabaseAuth,
  asyncHandler(createBloodCollectionHandler)
);

export default router;
