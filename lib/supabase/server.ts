import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config";

type CookieToSet = { name: string; value: string; options: CookieOptions };

// NOTE: deliberately not parameterized with the generated `Database` type —
// the installed @supabase/supabase-js version's generic plumbing doesn't
// resolve cleanly against our hand-generated types (collapses to `never`).
// Reads are cast to the exported `Lead`/`LeadNote` types at the call site
// instead (see lib/database.types.ts); writes stay loosely typed.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component render — middleware refreshes
          // the session on the next request, so this is safe to ignore.
        }
      },
    },
  });
}
