import { verifyRequesterToken } from "../shared/security/requesterToken.js";

export const requesterAuth = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  req.requester = verifyRequesterToken(token);
  next();
};
