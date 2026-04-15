import { createClient } from "@supabase/supabase-js";

// Falls back to placeholder values at build time (no env vars available then).
// At runtime on Vercel, the real env vars are always present.
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "placeholder-key";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
  key
);
