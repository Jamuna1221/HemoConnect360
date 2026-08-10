import { Router } from "express";
import { apiRoutes } from "../../config/apiRoutes.js";
import { requesterAuth } from "../../middleware/requesterAuth.js";
import { asyncHandler } from "../../shared/http/asyncHandler.js";
import {
  createRequest,
  listRequests,
  getRequest,
  cancelRequest,
  getMatches,
} from "./bloodRequest.controller.js";

const router = Router();

router.post(apiRoutes.bloodRequests.create, requesterAuth, asyncHandler(createRequest));
router.get(apiRoutes.bloodRequests.list, requesterAuth, asyncHandler(listRequests));
router.get(apiRoutes.bloodRequests.detail, requesterAuth, asyncHandler(getRequest));
router.get(apiRoutes.bloodRequests.matches, requesterAuth, asyncHandler(getMatches));
router.patch(apiRoutes.bloodRequests.cancel, requesterAuth, asyncHandler(cancelRequest));

export default router;