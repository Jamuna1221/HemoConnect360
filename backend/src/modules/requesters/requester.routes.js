import { Router } from "express";
import { apiRoutes } from "../../config/apiRoutes.js";
import { requesterAuth } from "../../middleware/requesterAuth.js";
import { asyncHandler } from "../../shared/http/asyncHandler.js";
import {
  phoneLogin,
  getRequesterAccount,
  updateRequesterProfile,
  registerPushToken,
  getNotifications,
  markNotificationRead,
} from "./requester.controller.js";

const router = Router();

router.post(apiRoutes.requesters.phoneLogin, asyncHandler(phoneLogin));
router.get(apiRoutes.requesters.me, requesterAuth, asyncHandler(getRequesterAccount));
router.put(apiRoutes.requesters.profile, requesterAuth, asyncHandler(updateRequesterProfile));
router.post(apiRoutes.requesters.pushToken, requesterAuth, asyncHandler(registerPushToken));
router.get(apiRoutes.requesters.notifications, requesterAuth, asyncHandler(getNotifications));
router.patch(apiRoutes.requesters.notificationRead, requesterAuth, asyncHandler(markNotificationRead));

export default router;
