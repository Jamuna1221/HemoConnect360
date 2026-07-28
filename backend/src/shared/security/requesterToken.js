import crypto from "crypto";
import { env } from "../../config/env.js";
import { ApiError } from "../http/ApiError.js";

const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const decode = (value) => {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    throw new ApiError(401, "Invalid requester token payload");
  }
};

export const createRequesterToken = (user) => {
  const payload = {
    sub: user.id,
    phone: user.phone,
    type: "requester",
    iat: Date.now(),
  };
  const body = encode(payload);
  const signature = crypto
    .createHmac("sha256", env.requesterTokenSecret)
    .update(body)
    .digest("base64url");

  return `${body}.${signature}`;
};

export const verifyRequesterToken = (token) => {
  if (!token || !token.includes(".")) {
    throw new ApiError(401, "Requester token is required");
  }

  const [body, signature] = token.split(".");
  const expectedSignature = crypto
    .createHmac("sha256", env.requesterTokenSecret)
    .update(body)
    .digest("base64url");

  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedSignatureBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  ) {
    throw new ApiError(401, "Invalid requester token");
  }

  const payload = decode(body);
  if (payload.type !== "requester" || !payload.sub || !payload.phone) {
    throw new ApiError(401, "Invalid requester token payload");
  }

  return payload;
};
