import { Router } from "express";
import { apiRoutes } from "../../config/apiRoutes.js";
import { supabaseAuth } from "../../middleware/supabaseAuth.js";
import { asyncHandler } from "../../shared/http/asyncHandler.js";
import {
  listBloodBankRequestsHandler,
  getBloodBankRequestDetailHandler,
  acceptBloodBankRequestHandler,
  rejectBloodBankRequestHandler,
  completeBloodBankRequestHandler,
} from "./bloodRequestBank.controller.js";

const router = Router();

router.get(
  apiRoutes.bloodRequests.bankList,
  supabaseAuth,
  asyncHandler(listBloodBankRequestsHandler)
);

router.get(
  apiRoutes.bloodRequests.bankDetail,
  supabaseAuth,
  asyncHandler(getBloodBankRequestDetailHandler)
);

router.patch(
  apiRoutes.bloodRequests.bankAccept,
  supabaseAuth,
  asyncHandler(acceptBloodBankRequestHandler)
);

router.patch(
  apiRoutes.bloodRequests.bankReject,
  supabaseAuth,
  asyncHandler(rejectBloodBankRequestHandler)
);

router.patch(
  apiRoutes.bloodRequests.bankComplete,
  supabaseAuth,
  asyncHandler(completeBloodBankRequestHandler)
);

export default router;
