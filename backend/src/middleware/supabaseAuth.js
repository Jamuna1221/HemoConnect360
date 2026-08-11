import supabase from "../config/supabase.js";
import { ApiError } from "../shared/http/ApiError.js";

/**
 * Authenticate a request with a Supabase access token.
 *
 * The token is verified against the Supabase auth server (supabase.auth.getUser)
 * using the existing shared client - the backend never trusts a user_id sent by
 * the client. On success the authenticated user is attached to the request and
 * the original token is kept for the request-scoped client used downstream.
 */
export const supabaseAuth = async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return next(new ApiError(401, "Authentication token is required"));
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user?.id) {
      return next(new ApiError(401, "Invalid or expired authentication token"));
    }

    req.user = {
      id: data.user.id,
      email: data.user.email || "",
    };
    req.accessToken = token;
    return next();
  } catch (err) {
    return next(new ApiError(401, "Invalid or expired authentication token"));
  }
};
