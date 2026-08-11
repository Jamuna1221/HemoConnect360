import { ApiError } from "../../shared/http/ApiError.js";

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const PRIORITIES = ["critical", "urgent", "standard"];

export const REQUEST_STATUSES = [
  "submitted",
  "notified",
  "searching_donors",
  "accepted",
  "approved",
  "rejected",
  "completed",
  "cancelled",
  "fulfilled",
];

export const NEARBY_SORTS = ["nearest", "urgent", "newest"];

const REJECT_REASON_MIN = 3;
const REJECT_REASON_MAX = 500;

export const validateRejectReason = (body) => {
  const reason = String(body?.reason || "").trim();

  if (reason.length < REJECT_REASON_MIN) {
    throw new ApiError(
      400,
      `Please provide a reason (at least ${REJECT_REASON_MIN} characters)`
    );
  }
  if (reason.length > REJECT_REASON_MAX) {
    throw new ApiError(
      400,
      `Reason must be ${REJECT_REASON_MAX} characters or fewer`
    );
  }

  return { reason };
};

export const validateAcceptBody = (body) => {
  const note = String(body?.note || "").trim().slice(0, 500);
  return { note };
};

export const validateListQuery = (query = {}) => {
  const status = String(query.status || "").trim().toLowerCase();
  const bloodGroup = String(query.bloodGroup || "").trim();
  const priority = String(query.priority || "").trim().toLowerCase();
  const search = String(query.search || "").trim();
  const page = Number.parseInt(query.page, 10);
  const limit = Number.parseInt(query.limit, 10);

  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safeLimit =
    Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : 20;

  if (
    status &&
    status !== "all" &&
    status !== "open" &&
    status !== "decided" &&
    !REQUEST_STATUSES.includes(status)
  ) {
    throw new ApiError(400, "Invalid status filter");
  }

  if (bloodGroup && !BLOOD_GROUPS.includes(bloodGroup)) {
    throw new ApiError(400, "Invalid blood group filter");
  }

  if (priority && !PRIORITIES.includes(priority)) {
    throw new ApiError(400, "Invalid priority filter");
  }

  return { status, bloodGroup, priority, search, page: safePage, limit: safeLimit };
};

const isValidDate = (value) => {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
};

export const validateNearbyListQuery = (query = {}) => {
  const status = String(query.status || "").trim().toLowerCase();
  const bloodGroup = String(query.bloodGroup || "").trim();
  const priority = String(query.priority || "").trim().toLowerCase();
  const from = String(query.from || "").trim();
  const to = String(query.to || "").trim();
  const sort = String(query.sort || "").trim().toLowerCase();
  const radiusKm =
    query.radiusKm === undefined || query.radiusKm === ""
      ? 25
      : Number(query.radiusKm);
  const page = Number.parseInt(query.page, 10);
  const limit = Number.parseInt(query.limit, 10);

  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safeLimit =
    Number.isInteger(limit) && limit > 0 ? Math.min(limit, 50) : 10;

  if (
    status &&
    status !== "all" &&
    status !== "open" &&
    status !== "decided" &&
    !REQUEST_STATUSES.includes(status)
  ) {
    throw new ApiError(400, "Invalid status filter");
  }

  if (bloodGroup && !BLOOD_GROUPS.includes(bloodGroup)) {
    throw new ApiError(400, "Invalid blood group filter");
  }

  if (priority && !PRIORITIES.includes(priority)) {
    throw new ApiError(400, "Invalid priority filter");
  }

  if (sort && !NEARBY_SORTS.includes(sort)) {
    throw new ApiError(400, "Invalid sort option");
  }

  if (!Number.isFinite(radiusKm)) {
    throw new ApiError(400, "Invalid radius filter");
  }

  if (from && !isValidDate(from)) {
    throw new ApiError(400, "Invalid from date");
  }

  if (to && !isValidDate(to)) {
    throw new ApiError(400, "Invalid to date");
  }

  return {
    status,
    bloodGroup,
    priority,
    from,
    to,
    sort: sort || "nearest",
    radiusKm,
    page: safePage,
    limit: safeLimit,
  };
};
