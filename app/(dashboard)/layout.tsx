import { logout } from "@/app/actions/auth";
import { LogoLockup } from "@/components/Logo";
import { SidebarNav } from "@/components/SidebarNav";
import { NotificationsBell } from "@/components/NotificationsBell";
import { IconLogout } from "@/components/icons";
import { getCurrentProfile, isAdmin } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await getCurrentProfile();
  const admin = isAdmin(profile);

  return (
    <div className="min-h-screen flex bg-[#F3F4F7]">
      <aside className="sticky top-0 h-screen w-64 shrink-0 flex flex-col bg-brand-ink">
        <div className="flex h-16 items-center px-5 border-b border-white/10">
          <LogoLockup />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <div className="mb-4 border-b border-white/10 pb-4">
            <NotificationsBell />
          </div>
          <SidebarNav isAdmin={admin} />
        </div>
        <div className="border-t border-white/10 px-3 py-4">
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              <IconLogout className="h-[18px] w-[18px]" />
              Salir
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-[1400px] p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
