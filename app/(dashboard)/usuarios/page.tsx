import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, isAdmin } from "@/lib/auth";
import { NewUserDialog } from "@/components/NewUserDialog";
import { TeamMemberRow } from "@/components/TeamMemberRow";
import type { Profile } from "@/lib/database.types";

export default async function UsuariosPage() {
  const profile = await getCurrentProfile();
  if (!isAdmin(profile)) redirect("/leads");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  const profiles = (data as Profile[] | null) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-brand-ink">Usuarios</h1>
          <p className="text-sm text-slate-500">
            Cuentas con acceso al panel. Los comerciales solo ven los leads y clientes que crean o
            que les asignes.
          </p>
        </div>
        <NewUserDialog />
      </div>

      {error && <p className="text-sm text-red-500">{error.message}</p>}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Usuario</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Alta</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {profiles.map((p) => (
              <TeamMemberRow key={p.id} profile={p} isSelf={p.id === profile?.id} />
            ))}
            {profiles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  Todavía no hay usuarios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
