import { Router } from "express";
import multer from "multer";

import { apiRoutes } from "../../config/apiRoutes.js";
import { env } from "../../config/env.js";
import { supabaseAuth } from "../../middleware/supabaseAuth.js";
import { adminAuth } from "../../middleware/adminAuth.js";
import { asyncHandler } from "../../shared/http/asyncHandler.js";
import { ApiError } from "../../shared/http/ApiError.js";

import {
  registerBloodBankHandler,
  getBloodBankProfileHandler,
  updateBloodBankProfileHandler,
  getBloodBankSettingsHandler,
  updateBloodBankSettingsHandler,
  getAllBloodBanksForAdminHandler,
  verifyBloodBankForAdminHandler,
} from "./bloodBank.controller.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.bloodBankDocMaxMb * 1024 * 1024,
    files: 2,
  },
});

const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return next(
        new ApiError(
          400,
          `Each document must be ${env.bloodBankDocMaxMb} MB or smaller`
        )
      );
    }

    return next(
      new ApiError(400, `Document upload error: ${error.message}`)
    );
  }

  return next(error);
};

const documentFields = upload.fields([
  { name: "licenseDoc", maxCount: 1 },
  { name: "authorizationDoc", maxCount: 1 },
]);

// Blood Bank Registration
router.post(
  apiRoutes.bloodBanks.register,
  documentFields,
  handleMulterError,
  asyncHandler(registerBloodBankHandler)
);

// Blood Bank Profile
router.get(
  apiRoutes.bloodBanks.me,
  supabaseAuth,
  asyncHandler(getBloodBankProfileHandler)
);

router.patch(
  apiRoutes.bloodBanks.me,
  supabaseAuth,
  asyncHandler(updateBloodBankProfileHandler)
);

// Blood Bank Settings
router.get(
  apiRoutes.bloodBanks.settings,
  supabaseAuth,
  asyncHandler(getBloodBankSettingsHandler)
);

router.patch(
  apiRoutes.bloodBanks.settings,
  supabaseAuth,
  asyncHandler(updateBloodBankSettingsHandler)
);

// Admin Console Endpoints
router.get(
  "/",
  adminAuth,
  asyncHandler(getAllBloodBanksForAdminHandler)
);

router.patch(
  "/:id/verify",
  adminAuth,
  asyncHandler(verifyBloodBankForAdminHandler)
);

export default router;