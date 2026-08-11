import {
  listBloodBankRequests,
  listNearbyBloodBankRequests,
  getBloodBankRequestDetail,
  acceptBloodBankRequest,
  rejectBloodBankRequest,
  completeBloodBankRequest,
} from "./bloodRequestBank.service.js";
import {
  validateListQuery,
  validateNearbyListQuery,
  validateRejectReason,
  validateAcceptBody,
} from "./bloodRequestBank.validation.js";

export const listBloodBankRequestsHandler = async (req, res) => {
  const filters = validateListQuery(req.query);
  const data = await listBloodBankRequests({
    accessToken: req.accessToken,
    user: req.user,
    filters,
  });

  res.json({ success: true, data });
};

export const listNearbyBloodBankRequestsHandler = async (req, res) => {
  const filters = validateNearbyListQuery(req.query);
  const data = await listNearbyBloodBankRequests({
    accessToken: req.accessToken,
    user: req.user,
    filters,
  });

  res.json({ success: true, data });
};

export const getBloodBankRequestDetailHandler = async (req, res) => {
  const data = await getBloodBankRequestDetail({
    accessToken: req.accessToken,
    user: req.user,
    id: req.params.id,
  });

  res.json({ success: true, data });
};

export const acceptBloodBankRequestHandler = async (req, res) => {
  validateAcceptBody(req.body);
  const data = await acceptBloodBankRequest({
    accessToken: req.accessToken,
    user: req.user,
    id: req.params.id,
  });

  res.json({ success: true, data });
};

export const rejectBloodBankRequestHandler = async (req, res) => {
  const { reason } = validateRejectReason(req.body);
  const data = await rejectBloodBankRequest({
    accessToken: req.accessToken,
    user: req.user,
    id: req.params.id,
    reason,
  });

  res.json({ success: true, data });
};

export const completeBloodBankRequestHandler = async (req, res) => {
  const data = await completeBloodBankRequest({
    accessToken: req.accessToken,
    user: req.user,
    id: req.params.id,
  });

  res.json({ success: true, data });
};
