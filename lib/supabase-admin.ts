import { createClient } from "@supabase/supabase-js";

// Usa SUPABASE_SERVICE_ROLE_KEY si está definida (bypasa RLS).
// Si no está, cae al anon key — funciona mientras RLS esté desactivado en las tablas.
// Supabase → Settings → API → "service_role" (pulsa Reveal para verla).
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  key
);
