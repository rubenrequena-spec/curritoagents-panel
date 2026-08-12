"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TASK_TYPE_LABELS, TASK_TYPE_STYLES } from "@/lib/constants";
import { Badge } from "@/components/Badge";
import { IconBell } from "@/components/icons";
import type { NewLeadItem, DueTaskItem } from "@/lib/notifications";

export type { NewLeadItem, DueTaskItem };

// The bell lives in the dashboard layout, which Next.js does not remount or
// re-fetch on client-side navigation between pages — so without its own
// polling, these notifications would stay frozen at whatever they were on
// the first page load, no matter what changes elsewhere in the app.
const POLL_INTERVAL_MS = 30_000;

// Which leads/tasks the user has already seen, so the badge only counts what
// showed up since the last time they opened the bell — not every outstanding
// lead/task forever. Persisted per-browser; re-derived from scratch (nothing
// carried over) each time the bell opens, so an item that leaves and later
// reappears in the list counts as unread again instead of staying "seen".
const SEEN_KEY = "notifications-seen-ids";
const leadKey = (id: string) => `lead:${id}`;
const taskKey = (id: string) => `task:${id}`;

function loadSeenIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function NotificationsBellPanel({
  initialNewLeads,
  initialDueTasks,
}: {
  initialNewLeads: NewLeadItem[];
  initialDueTasks: DueTaskItem[];
}) {
  const [open, setOpen] = useState(false);
  const [newLeads, setNewLeads] = useState(initialNewLeads);
  const [dueTasks, setDueTasks] = useState(initialDueTasks);
  const [seenIds, setSeenIds] = useState<Set<string>>(() => loadSeenIds());
  const containerRef = useRef<HTMLDivElement>(null);
  const unread =
    newLeads.filter((l) => !seenIds.has(leadKey(l.id))).length +
    dueTasks.filter((t) => !seenIds.has(taskKey(t.id))).length;
  const now = Date.now();

  const refresh = useCallback(async (markSeen: boolean) => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const leads: NewLeadItem[] = data.newLeads ?? [];
      const tasks: DueTaskItem[] = data.dueTasks ?? [];
      setNewLeads(leads);
      setDueTasks(tasks);
      if (markSeen) {
        const next = new Set([...leads.map((l) => leadKey(l.id)), ...tasks.map((t) => taskKey(t.id))]);
        setSeenIds(next);
        try {
          window.localStorage.setItem(SEEN_KEY, JSON.stringify([...next]));
        } catch {
          // Private browsing / quota — badge just won't persist across reloads.
        }
      }
    } catch {
      // Silently keep showing the last known-good data; the next poll retries.
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => refresh(false), POLL_INTERVAL_MS);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refresh(false);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    refresh(true);
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
      >
        <span className="relative">
          <IconBell className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </span>
        Notificaciones
      </button>

      {open && (
        <div className="fixed left-56 top-20 z-50 w-80 max-h-[70vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Leads nuevos
              </h3>
              <div className="space-y-1.5">
                {newLeads.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/leads/${lead.id}`}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-2 py-1.5 hover:bg-blue-50/60"
                  >
                    <div className="font-medium text-brand-ink">{lead.nombre}</div>
                    <div className="text-xs text-slate-500">{lead.negocio}</div>
                  </Link>
                ))}
                {newLeads.length === 0 && <p className="px-2 text-xs text-slate-400">Sin leads nuevos.</p>}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Tareas próximas
              </h3>
              <div className="space-y-1.5">
                {dueTasks.map((task) => {
                  const overdue = new Date(task.scheduled_at).getTime() < now;
                  return (
                    <Link
                      key={task.id}
                      href={task.lead ? `/leads/${task.lead.id}#tarea-${task.id}` : "/leads"}
                      onClick={() => setOpen(false)}
                      className="block rounded-lg px-2 py-1.5 hover:bg-blue-50/60"
                    >
                      <div className="flex items-center gap-2">
                        <Badge className={TASK_TYPE_STYLES[task.type]}>{TASK_TYPE_LABELS[task.type]}</Badge>
                        <span className="font-medium text-brand-ink">
                          {task.lead?.nombre ?? "Lead"}
                        </span>
                      </div>
                      <div className={`text-xs ${overdue ? "font-medium text-red-600" : "text-slate-500"}`}>
                        {new Date(task.scheduled_at).toLocaleString("es-ES", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </div>
                    </Link>
                  );
                })}
                {dueTasks.length === 0 && (
                  <p className="px-2 text-xs text-slate-400">Sin tareas próximas.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
