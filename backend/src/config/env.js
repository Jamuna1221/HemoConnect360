import dotenv from "dotenv";

dotenv.config();

const required = ["SUPABASE_URL", "SUPABASE_KEY"];

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
  requesterTokenSecret:
    process.env.REQUESTER_TOKEN_SECRET || process.env.SUPABASE_KEY,
  donorMatchRadiusKm: Number(process.env.DONOR_MATCH_RADIUS_KM || 10),
  donorMatchMaxDonors: Number(process.env.DONOR_MATCH_MAX_DONORS || 25),
};
