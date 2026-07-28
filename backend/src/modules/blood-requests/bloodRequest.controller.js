import {
  createBloodRequest,
  getRequesterRequests,
  getRequestById,
  cancelBloodRequest,
} from "./bloodRequest.service.js";
import { validateCreateRequest } from "./bloodRequest.validation.js";

export const createRequest = async (req, res) => {
  const input = validateCreateRequest(req.body);
  const request = await createBloodRequest(req.requester.sub, input);

  res.status(201).json({ success: true, data: request });
};

export const listRequests = async (req, res) => {
  const requests = await getRequesterRequests(req.requester.sub);

  res.json({ success: true, data: requests });
};

export const getRequest = async (req, res) => {
  const request = await getRequestById(req.params.id, req.requester.sub);

  res.json({ success: true, data: request });
};

export const cancelRequest = async (req, res) => {
  const request = await cancelBloodRequest(req.params.id, req.requester.sub);

  res.json({ success: true, data: request });
};