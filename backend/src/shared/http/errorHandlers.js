import { ApiError } from "./ApiError.js";

export const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;

  // ApiError messages are curated and safe to show to the caller. Unexpected
  // errors (non-ApiError) are masked so internal details never leak.
  const message = error instanceof ApiError ? error.message : "Internal server error";

  res.status(statusCode).json({
    success: false,
    message,
    details: error.details || undefined,
  });
};
