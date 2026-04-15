import { createClient } from "@supabase/supabase-js";

// Solo para uso en servidor (server actions, API routes).
// Usa la service role key → ignora RLS.
// Añade SUPABASE_SERVICE_ROLE_KEY en Vercel → Project Settings → Env Vars.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
