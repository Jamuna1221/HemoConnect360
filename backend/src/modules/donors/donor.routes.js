import { Router } from "express";
import { apiRoutes } from "../../config/apiRoutes.js";
import { asyncHandler } from "../../shared/http/asyncHandler.js";
import { registerDonorHandler } from "./donor.controller.js";

const router = Router();

router.post(apiRoutes.donors.register, asyncHandler(registerDonorHandler));

export default router;
