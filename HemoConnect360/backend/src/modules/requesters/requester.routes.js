import { Router } from "express";
import { apiRoutes } from "../../config/apiRoutes.js";
import { requesterAuth } from "../../middleware/requesterAuth.js";
import { asyncHandler } from "../../shared/http/asyncHandler.js";
import {
  phoneLogin,
  getRequesterAccount,
  updateRequesterProfile,
} from "./requester.controller.js";

const router = Router();

router.post(apiRoutes.requesters.phoneLogin, asyncHandler(phoneLogin));
router.get(apiRoutes.requesters.me, requesterAuth, asyncHandler(getRequesterAccount));
router.put(apiRoutes.requesters.profile, requesterAuth, asyncHandler(updateRequesterProfile));

export default router;
