import { notifyRequesterOfOutcome } from "./push.service.js";
import supabaseAdmin from "../../config/supabaseAdmin.js";

export const notifyDonorOutcome = async (req, res) => {
  const requestId = String(req.body?.requestId || "").trim();
  const donated = Boolean(req.body?.donated);
  if (!requestId) return res.status(400).json({ success: false, message: "Request ID is required" });
  if (!supabaseAdmin) return res.status(503).json({ success: false, message: "Notifications are not configured" });
  const { data: match, error } = await supabaseAdmin
    .from("donor_matches")
    .select("donor_id")
    .eq("blood_request_id", requestId)
    .eq("donor_id", req.user.id)
    .maybeSingle();
  if (error || !match) return res.status(403).json({ success: false, message: "You are not matched to this request" });
  await notifyRequesterOfOutcome({ requestId, donated });
  res.json({ success: true });
};
