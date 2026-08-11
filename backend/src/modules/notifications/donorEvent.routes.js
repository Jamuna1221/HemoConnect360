import { Router } from "express";
import { apiRoutes } from "../../config/apiRoutes.js";
import { supabaseAuth } from "../../middleware/supabaseAuth.js";
import { asyncHandler } from "../../shared/http/asyncHandler.js";
import { notifyDonorOutcome } from "./donorEvent.controller.js";

const router = Router();
router.post(apiRoutes.donorEvents.outcome, supabaseAuth, asyncHandler(notifyDonorOutcome));
export default router;
