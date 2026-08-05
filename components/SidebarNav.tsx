"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconUsers, IconKanban, IconBriefcase, IconDashboard, IconUserCheck, IconClock } from "@/components/icons";

const ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: IconDashboard, adminOnly: true },
  { href: "/leads", label: "Leads", icon: IconUsers, adminOnly: false },
  { href: "/pipeline", label: "Pipeline", icon: IconKanban, adminOnly: false },
  { href: "/tareas", label: "Tareas", icon: IconClock, adminOnly: false },
  { href: "/clientes", label: "Clientes", icon: IconBriefcase, adminOnly: false },
  { href: "/usuarios", label: "Usuarios", icon: IconUserCheck, adminOnly: true },
];

export function SidebarNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items = ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <nav className="flex flex-col gap-1">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname?.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-brand-blue text-white shadow-sm shadow-brand-blue/30"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon className="h-[18px] w-[18px]" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
