import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// WARNING: This client bypasses Row Level Security (RLS).
// NEVER expose this to the client-side browser code.
// ONLY use this in trusted server contexts (e.g., API routes, Webhooks).
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
