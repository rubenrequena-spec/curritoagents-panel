"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile, isAdmin } from "@/lib/auth";
import type { Database } from "@/lib/database.types";

type UserRole = Database["public"]["Enums"]["user_role"];

export type ActionResult = { success: true } | { success: false; error: string };

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!isAdmin(profile)) return { ok: false, error: "No autorizado." };
  return { ok: true };
}

export type CreateTeamMemberInput = {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
};

// Admin sets the initial password directly (rather than an email invite) so
// account creation doesn't depend on Supabase's email sending being
// configured — see app/actions/users.ts callers (NewUserDialog).
export async function createTeamMember(input: CreateTeamMemberInput): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim() || null;
  if (!email) return { success: false, error: "El email es obligatorio." };
  if (input.password.length < 8) {
    return { success: false, error: "La contraseña debe tener al menos 8 caracteres." };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: input.role },
  });
  if (error || !data.user) {
    return { success: false, error: error?.message ?? "No se pudo crear el usuario." };
  }

  // Belt-and-suspenders: on_auth_user_created (0010 migration) already
  // inserts this row from user_metadata; upsert here too in case it's ever
  // missing so the account isn't left without a role.
  await admin
    .from("profiles")
    .upsert({ id: data.user.id, email, full_name: fullName, role: input.role });

  revalidatePath("/usuarios");
  return { success: true };
}

export async function updateTeamMemberRole(userId: string, role: UserRole): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  revalidatePath("/usuarios");
  return error ? { success: false, error: error.message } : { success: true };
}

// Soft-disable: flips profiles.active (cuts RLS access immediately) and bans
// the auth account (blocks future logins outright), without deleting the
// user or touching the leads/clients/notes they already own.
export async function setTeamMemberActive(userId: string, active: boolean): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }

  const { error: profileError } = await admin.from("profiles").update({ active }).eq("id", userId);
  if (profileError) return { success: false, error: profileError.message };

  const { error: authError } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: active ? "none" : "876000h",
  });
  if (authError) return { success: false, error: authError.message };

  revalidatePath("/usuarios");
  return { success: true };
}
