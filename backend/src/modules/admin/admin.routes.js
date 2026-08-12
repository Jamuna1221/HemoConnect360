import { Router } from "express";
import { apiRoutes } from "../../config/apiRoutes.js";
import { adminAuth } from "../../middleware/adminAuth.js";
import { asyncHandler } from "../../shared/http/asyncHandler.js";
import {
  getOverviewHandler,
  getVerificationHandler,
  applyVerificationHandler,
  getSecurityHandler,
  applySecurityActionHandler,
  getNotificationsHandler,
  readNotificationHandler,
  readAllNotificationsHandler,
  publishAnnouncementHandler,
  getAuditLogsHandler,
  getProfileHandler,
  updateProfileHandler,
  updateRequestStatusHandler,
} from "./admin.controller.js";

const router = Router();

router.use(adminAuth);

router.get(apiRoutes.admin.overview, asyncHandler(getOverviewHandler));
router.get(apiRoutes.admin.verification, asyncHandler(getVerificationHandler));
router.post(apiRoutes.admin.verificationApprove, asyncHandler(applyVerificationHandler));
router.post(apiRoutes.admin.verificationReject, asyncHandler(applyVerificationHandler));
router.post(apiRoutes.admin.verificationReverify, asyncHandler(applyVerificationHandler));
router.get(apiRoutes.admin.security, asyncHandler(getSecurityHandler));
router.post(apiRoutes.admin.securityAction, asyncHandler(applySecurityActionHandler));
router.get(apiRoutes.admin.notifications, asyncHandler(getNotificationsHandler));
router.post(apiRoutes.admin.notificationRead, asyncHandler(readNotificationHandler));
router.post(apiRoutes.admin.notificationReadAll, asyncHandler(readAllNotificationsHandler));
router.post(apiRoutes.admin.announcement, asyncHandler(publishAnnouncementHandler));
router.get(apiRoutes.admin.auditLogs, asyncHandler(getAuditLogsHandler));
router.get(apiRoutes.admin.profile, asyncHandler(getProfileHandler));
router.put(apiRoutes.admin.profile, asyncHandler(updateProfileHandler));
router.patch("/blood-requests/:id/status", asyncHandler(updateRequestStatusHandler));

export default router;
