import {
  getAvailableDonors,
  getDonorByPhone,
  getCollectionHistory,
  createBloodCollection,
} from "./bloodBankCollections.service.js";
import { validateRecordCollection } from "./bloodBankCollections.validation.js";

export const getAvailableDonorsHandler = async (req, res) => {
  const data = await getAvailableDonors({
    accessToken: req.accessToken,
    user: req.user,
  });

  res.json({ success: true, data });
};

export const getDonorByPhoneHandler = async (req, res) => {
  const data = await getDonorByPhone({
    accessToken: req.accessToken,
    user: req.user,
    phone: req.params.phone,
  });

  res.json({ success: true, data });
};

export const getCollectionHistoryHandler = async (req, res) => {
  const data = await getCollectionHistory({
    accessToken: req.accessToken,
    user: req.user,
  });

  res.json({ success: true, data });
};

export const createBloodCollectionHandler = async (req, res) => {
  const input = validateRecordCollection(req.body);
  const data = await createBloodCollection({
    accessToken: req.accessToken,
    user: req.user,
    input,
  });

  res.status(201).json({ success: true, data });
};
