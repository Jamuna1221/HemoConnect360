import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

const supabase = createClient(env.supabaseUrl, env.supabaseKey);

/**
 * Create a request-scoped Supabase client that acts as the authenticated user.
 *
 * The shared `supabase` client above only has the publishable (anon) key and no
 * auth context, so any table/storage operation would run with auth.uid() = NULL
 * and be denied by Row Level Security. By injecting the caller's verified access
 * token as the Authorization header, this client runs every query as that user,
 * so RLS policies (auth.uid() = user_id) apply correctly.
 *
 * A fresh client is used per request instead of mutating the shared one, because
 * setting the session on a shared instance would leak across concurrent
 * requests from different users.
 *
 * @param {string} accessToken - verified Supabase access token (from the request)
 * @returns {import("@supabase/supabase-js").SupabaseClient}
 */
export const createUserClient = (accessToken) =>
  createClient(env.supabaseUrl, env.supabaseKey, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

export const createAdminClient = () =>
  createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

export default supabase;
