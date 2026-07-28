"use client";

import { useState, useTransition } from "react";
import { updateTeamMemberRole, setTeamMemberActive } from "@/app/actions/users";
import { Badge } from "@/components/Badge";
import type { Database, Profile } from "@/lib/database.types";

type UserRole = Database["public"]["Enums"]["user_role"];

const ROLE_LABELS: Record<UserRole, string> = { admin: "Admin", comercial: "Comercial" };

export function TeamMemberRow({ profile, isSelf }: { profile: Profile; isSelf: boolean }) {
  const [role, setRole] = useState(profile.role);
  const [active, setActive] = useState(profile.active);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleRoleChange = (next: UserRole) => {
    setError(null);
    startTransition(async () => {
      const result = await updateTeamMemberRole(profile.id, next);
      if (result.success) setRole(next);
      else setError(result.error);
    });
  };

  const handleActiveToggle = () => {
    setError(null);
    startTransition(async () => {
      const result = await setTeamMemberActive(profile.id, !active);
      if (result.success) setActive(!active);
      else setError(result.error);
    });
  };

  return (
    <tr className="transition-colors hover:bg-blue-50/40">
      <td className="px-4 py-3">
        <div className="font-medium text-brand-ink">{profile.full_name || "—"}</div>
        <div className="text-xs text-slate-500">{profile.email}</div>
      </td>
      <td className="px-4 py-3">
        <select
          value={role}
          disabled={isPending || isSelf}
          onChange={(e) => handleRoleChange(e.target.value as UserRole)}
          className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-brand-ink outline-none focus:border-brand-blue disabled:opacity-50"
        >
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <Badge
          className={
            active
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-100 text-slate-600 border-slate-200"
          }
        >
          {active ? "Activo" : "Desactivado"}
        </Badge>
      </td>
      <td className="px-4 py-3 text-slate-400">
        {new Date(profile.created_at).toLocaleDateString("es-ES")}
      </td>
      <td className="px-4 py-3">
        {isSelf ? (
          <span className="text-xs text-slate-300">Tu cuenta</span>
        ) : (
          <button
            type="button"
            onClick={handleActiveToggle}
            disabled={isPending}
            className={`text-xs font-medium disabled:opacity-50 ${
              active ? "text-slate-500 hover:text-red-600" : "text-slate-500 hover:text-emerald-600"
            }`}
          >
            {active ? "Desactivar" : "Reactivar"}
          </button>
        )}
        {error && <div className="mt-1 text-xs text-red-500">{error}</div>}
      </td>
    </tr>
  );
}
