import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/database.types";

// Missing profile (shouldn't happen — every auth user gets one via the
// on_auth_user_created trigger or the 0010 backfill) fails closed as if
// logged out, rather than granting any access.
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (data as Profile | null) ?? null;
}

export function isAdmin(profile: Profile | null): boolean {
  return Boolean(profile?.active && profile.role === "admin");
}
