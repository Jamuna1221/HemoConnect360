import supabaseAdmin from "./src/config/supabaseAdmin.js";
import { createUserClient } from "./src/config/supabase.js";

const EMAIL = "e2e-bank2@test.local";
const PASSWORD = "TestBank@1234";
const PHONE = "9000000002";

// 1. Test bank user
const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
  email: EMAIL, password: PASSWORD, email_confirm: true,
});
if (createError) { console.log("CREATE_USER_ERROR:", createError.message); process.exit(1); }
const userId = created.user.id;

const { data: bank, error: bankError } = await supabaseAdmin
  .from("blood_banks")
  .insert({
    user_id: userId, blood_bank_name: "E2E Bank 2", registration_number: "E2E-RN-900002",
    blood_bank_type: "Private Blood Bank", established_year: 2021, official_email: EMAIL,
    primary_phone: PHONE, address_line: "2 E2E Street", city: "Kolkata", state: "West Bengal",
    pincode: "700002", authorized_person_name: "E2E P2", designation: "Manager", authorized_person_phone: PHONE,
  })
  .select("id");
if (bankError) { console.log("BANK_INSERT_ERROR:", bankError.message); process.exit(1); }
const bankId = bank[0].id;
console.log("BANK_ID:", bankId);

const { error: stockError } = await supabaseAdmin.from("blood_bank_inventory").upsert(
  { blood_bank_id: bankId, blood_group: "B+", units_available: 10 },
  { onConflict: "blood_bank_id,blood_group" }
);
if (stockError) { console.log("STOCK_ERROR:", stockError.message); process.exit(1); }

const { data: signIn, error: signInError } = await supabaseAdmin.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
if (signInError) { console.log("SIGNIN_ERROR:", signInError.message); process.exit(1); }
const accessToken = signIn.session.access_token;
console.log("BANK_READY");

// 2. Requester creates a NEW request via the real API
const login = await fetch("http://localhost:5000/api/requesters/phone-login", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ phone: "8123456789" }),
}).then((r) => r.json());
const reqToken = login.data.token;

const createBody = {
  patientName: "New Flow Patient", patientAge: 28, patientGender: "Female", bloodGroup: "B+",
  units: 1, hospitalName: "New Flow Hospital", city: "Kolkata", address: "3 New Road",
  requiredBy: "2026-08-20", priority: "normal", contactName: "NF", contactPhone: "8123456789",
  latitude: 22.5726, longitude: 88.3639, notes: "new request tracking check",
};
const createdReq = await fetch("http://localhost:5000/api/blood-requests", {
  method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${reqToken}` },
  body: JSON.stringify(createBody),
}).then((r) => r.json());
const reqId = createdReq.data.id;
console.log("NEW_REQUEST_ID:", reqId);
console.log("NEW_REQUEST_STATUS_AFTER_CREATE:", createdReq.data.status);

// 3. Bank accepts the NEW request via the real RPC
const client = createUserClient(accessToken);
const { data: rpc, error: rpcErr } = await client.rpc("blood_bank_accept_request", { p_request_id: reqId });
if (rpcErr) console.log("RPC_ERROR:", rpcErr.message);
console.log("RPC_RESULT:", JSON.stringify(rpc, null, 2));

// 4. What the requester's TrackRequest & context poll
const list = await fetch("http://localhost:5000/api/blood-requests", {
  headers: { Authorization: `Bearer ${reqToken}` },
}).then((r) => r.json());
const myReq = list.data.find((r) => r.id === reqId);
console.log("LIST_STATUS:", myReq?.status);

const detail = await fetch(`http://localhost:5000/api/blood-requests/${reqId}`, {
  headers: { Authorization: `Bearer ${reqToken}` },
}).then((r) => r.json());
console.log("DETAIL_STATUS:", detail.data?.status);

// 5. Simulate TrackRequest rendering for this request
const STATUS_STEPS = [
  { status: "submitted", label: "Submitted" },
  { status: "searching", label: "Searching" },
  { status: "notified", label: "Donors Notified" },
  { status: "accepted", label: "Donor Accepted" },
  { status: "approved", label: "Approved by Blood Bank" },
  { status: "donated", label: "Blood Donated" },
  { status: "completed", label: "Completed" },
];
const currentStepIndex = (status) => {
  const n = status === "searching_donors" ? "searching" : status === "donor_accepted" ? "accepted" : status;
  const idx = STATUS_STEPS.findIndex((s) => s.status === n);
  return idx === -1 ? 0 : idx;
};
const step = currentStepIndex(myReq?.status);
console.log("TRACK_RENDER_STEP:", step, "=>", STATUS_STEPS[step]?.label);
console.log("BANNER_APPROVED:", myReq?.status === "approved" || myReq?.status === "completed");

// 6. Cleanup
await supabaseAdmin.from("blood_request_bank_actions").delete().eq("blood_request_id", reqId);
await supabaseAdmin.from("blood_requests").delete().eq("id", reqId);
const { error: uErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
if (uErr) console.log("CLEANUP_USER_ERROR:", uErr.message);
console.log("CLEANUP_DONE");
