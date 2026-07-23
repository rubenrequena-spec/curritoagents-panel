import Link from "next/link";
import { logout } from "@/app/actions/auth";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-semibold">CurritoAgents · Panel</span>
          <Link href="/leads" className="text-sm text-slate-300 hover:text-white">
            Leads
          </Link>
          <Link href="/pipeline" className="text-sm text-slate-300 hover:text-white">
            Pipeline
          </Link>
        </div>
        <form action={logout}>
          <button type="submit" className="text-sm text-slate-400 hover:text-white">
            Salir
          </button>
        </form>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  );
}
