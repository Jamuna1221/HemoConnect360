import { ApiError } from "../shared/http/ApiError.js";

/**
 * Middleware to authenticate requests from the Admin dashboard.
 * Uses the mock admin-session token "admin-mock-token".
 */
export const adminAuth = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (token === "admin-mock-token") {
    req.isAdmin = true;
    return next();
  }

  return next(new ApiError(401, "Unauthorized admin access"));
};
