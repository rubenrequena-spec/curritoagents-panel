import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/supabase/config";

// Service-role client: bypasses RLS entirely, so it's only ever used from
// server actions that create/manage auth accounts (app/actions/users.ts),
// each of which re-checks the caller is an active admin via the regular
// cookie-bound client before touching this. Never exposed to the browser.
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY en el entorno del servidor. Añádela en .env.local (clave " +
        "service_role del proyecto Supabase, en Project Settings → API) y en las variables de " +
        "entorno del hosting.",
    );
  }
  return createSupabaseClient(SUPABASE_URL, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
