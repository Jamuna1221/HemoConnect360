import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

const supabaseAdmin = env.supabaseServiceRoleKey
  ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

export default supabaseAdmin;
