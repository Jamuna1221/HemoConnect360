import { env } from "../config/env.js";
import { ApiError } from "../shared/http/ApiError.js";

/**
 * Protect the Admin API routes.
 *
 * The existing admin login flow issues an admin session token from the
 * frontend (localStorage `admin_session`). This middleware requires the same
 * bearer token in the Authorization header so the admin endpoints are not open
 * to anonymous callers. The token value is configured server-side
 * (ADMIN_API_TOKEN, defaults to the token issued by the existing admin login).
 * The admin email carried by the session is attached to the request for audit
 * logging.
 */
export const adminAuth = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token || token !== env.adminApiToken) {
    return next(new ApiError(401, "Valid admin authentication is required"));
  }

  req.admin = {
    email: req.headers["x-admin-email"] || "admin@hemoconnect360.com",
  };
  return next();
};
