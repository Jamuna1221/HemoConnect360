import dotenv from "dotenv";

dotenv.config();

const required = ["SUPABASE_URL", "SUPABASE_KEY", "SUPABASE_SERVICE_ROLE_KEY"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  port: Number(process.env.PORT || 5000),
  corsOrigin: process.env.CORS_ORIGIN || true,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  // Comma-separated list of admin emails allowed to access the admin API.
  adminEmails: (process.env.ADMIN_EMAILS || "admin@hemoconnect360.com")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
  firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "",
  requesterTokenSecret:
    process.env.REQUESTER_TOKEN_SECRET || process.env.SUPABASE_KEY,
  adminApiToken:
    process.env.ADMIN_API_TOKEN || "admin-mock-token",
  donorMatchRadiusKm: Number(process.env.DONOR_MATCH_RADIUS_KM || 10),
  donorMatchMaxDonors: Number(process.env.DONOR_MATCH_MAX_DONORS || 25),
  bloodBankDocMaxMb: Number(process.env.BLOOD_BANK_DOC_MAX_MB || 5),
};
