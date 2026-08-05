"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { setTaskCompleted, rescheduleTask } from "@/app/actions/tasks";
import { addLeadNote } from "@/app/actions/leads";
import { TASK_TYPE_LABELS, TASK_TYPE_STYLES } from "@/lib/constants";
import { Badge } from "@/components/Badge";
import { IconCheck, IconClock } from "@/components/icons";
import type { Database } from "@/lib/database.types";

type TaskType = Database["public"]["Enums"]["task_type"];

export type TaskWithLead = {
  id: string;
  type: TaskType;
  scheduled_at: string;
  notes: string | null;
  completed: boolean;
  lead_id: string;
  lead: { id: string; nombre: string; negocio: string } | null;
};

const WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];
const COMPLETE_FADE_MS = 500;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function monthLabel(year: number, month: number): string {
  return capitalize(new Date(year, month, 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" }));
}

function buildMonthCells(year: number, month: number): (Date | null)[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-start grid
  const cells: (Date | null)[] = Array.from({ length: leading }, () => null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));
  return cells;
}

// datetime-local inputs want "YYYY-MM-DDTHH:mm" in the browser's local time,
// no timezone suffix — same conversion LeadTasks.tsx uses for its own input.
function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  d.setSeconds(0, 0);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function nowForDatetimeLocal(): string {
  return toDatetimeLocalValue(new Date().toISOString());
}

type ConfirmTarget = { mode: "single"; task: TaskWithLead } | { mode: "bulk"; ids: string[] };

export function TasksAgenda({ initialTasks }: { initialTasks: TaskWithLead[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);
  const [postponingId, setPostponingId] = useState<string | null>(null);
  const [postponeValue, setPostponeValue] = useState("");
  const [postponeError, setPostponeError] = useState<string | null>(null);
  const today = startOfDay(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [calendarMonth, setCalendarMonth] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const now = Date.now();

  const tasksByDay = useMemo(() => {
    const map = new Map<string, TaskWithLead[]>();
    for (const task of tasks) {
      const key = toDateKey(new Date(task.scheduled_at));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    }
    for (const list of map.values()) list.sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
    return map;
  }, [tasks]);

  const overdue = tasks
    .filter((t) => startOfDay(new Date(t.scheduled_at)).getTime() < today.getTime())
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));

  const selectDay = (date: Date) => {
    const day = startOfDay(date);
    setSelectedDate(day);
    setCalendarMonth({ year: day.getFullYear(), month: day.getMonth() });
  };

  const shiftMonth = (delta: number) => {
    const d = new Date(calendarMonth.year, calendarMonth.month + delta, 1);
    setCalendarMonth({ year: d.getFullYear(), month: d.getMonth() });
  };

  const shiftSelectedDay = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    selectDay(d);
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  // Finalizing a task both completes it and leaves a note on its lead, so
  // there's a visible trace of the follow-up in the lead's own history.
  const finalizeIds = (ids: string[]) => {
    setCompletingIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
    ids.forEach((id) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      setTaskCompleted(task.id, task.lead_id, true);
      const when = new Date(task.scheduled_at).toLocaleString("es-ES", {
        dateStyle: "medium",
        timeStyle: "short",
      });
      addLeadNote(
        task.lead_id,
        `Tarea finalizada: ${TASK_TYPE_LABELS[task.type]} (${when})${task.notes ? ` — ${task.notes}` : ""}`,
      );
    });
    setTimeout(() => {
      setTasks((prev) => prev.filter((t) => !ids.includes(t.id)));
      setCompletingIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    }, COMPLETE_FADE_MS);
    clearSelection();
  };

  const handleFinalizeConfirm = () => {
    if (!confirmTarget) return;
    const ids = confirmTarget.mode === "single" ? [confirmTarget.task.id] : confirmTarget.ids;
    finalizeIds(ids);
    setConfirmTarget(null);
  };

  const startPostpone = (task: TaskWithLead) => {
    setPostponingId(task.id);
    setPostponeValue(toDatetimeLocalValue(task.scheduled_at));
    setPostponeError(null);
  };

  const savePostpone = (task: TaskWithLead) => {
    if (!postponeValue) return;
    if (new Date(postponeValue).getTime() < Date.now()) {
      setPostponeError("No se puede posponer a una fecha pasada.");
      return;
    }
    const iso = new Date(postponeValue).toISOString();
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, scheduled_at: iso } : t)));
    rescheduleTask(task.id, task.lead_id, iso);
    setPostponingId(null);
  };

  const renderTask = (task: TaskWithLead) => {
    const completing = completingIds.has(task.id);
    const overdueTask = !completing && new Date(task.scheduled_at).getTime() < now;
    const postponing = postponingId === task.id;
    return (
      <div
        key={task.id}
        className={`flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm transition-opacity duration-500 ${
          overdueTask ? "border-l-2 border-l-red-400" : ""
        } ${completing ? "opacity-40" : ""}`}
      >
        <input
          type="checkbox"
          checked={selectedIds.has(task.id)}
          disabled={completing}
          onChange={() => toggleSelected(task.id)}
          className="mt-0.5 accent-brand-blue"
        />
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={TASK_TYPE_STYLES[task.type]}>{TASK_TYPE_LABELS[task.type]}</Badge>
            <span
              className={`text-xs ${overdueTask ? "font-medium text-red-600" : "text-slate-500"} ${
                completing ? "line-through" : ""
              }`}
            >
              {new Date(task.scheduled_at).toLocaleString("es-ES", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
            {task.lead && (
              <Link href={`/leads/${task.lead.id}`} className="text-xs text-brand-blue hover:underline">
                {task.lead.nombre} · {task.lead.negocio}
              </Link>
            )}
          </div>
          {task.notes && (
            <p className={`whitespace-pre-wrap ${completing ? "text-slate-400 line-through" : "text-brand-ink"}`}>
              {task.notes}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <div className="relative">
            <button
              type="button"
              onClick={() => (postponing ? setPostponingId(null) : startPostpone(task))}
              disabled={completing}
              title="Posponer"
              className={`rounded-md p-1.5 text-slate-400 hover:bg-slate-50 hover:text-brand-blue disabled:opacity-50 ${
                postponing ? "bg-slate-100 text-brand-blue" : ""
              }`}
            >
              <IconClock className="h-4 w-4" />
            </button>
            {postponing && (
              <div className="absolute right-0 top-full z-10 mt-2 w-64 space-y-2 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-lg">
                <input
                  type="datetime-local"
                  value={postponeValue}
                  min={nowForDatetimeLocal()}
                  onChange={(e) => {
                    setPostponeError(null);
                    setPostponeValue(e.target.value);
                  }}
                  className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-brand-ink outline-none focus:border-brand-blue"
                />
                {postponeError && <p className="text-xs text-red-500">{postponeError}</p>}
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setPostponingId(null)}
                    className="text-xs text-slate-400 hover:underline"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => savePostpone(task)}
                    className="text-xs font-medium text-brand-blue hover:underline"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setConfirmTarget({ mode: "single", task })}
            disabled={completing}
            title="Finalizar"
            className="rounded-md p-1.5 text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50"
          >
            <IconCheck className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  if (tasks.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-400">
        No hay tareas pendientes.
      </p>
    );
  }

  const selectedKey = toDateKey(selectedDate);
  const selectedTasks = tasksByDay.get(selectedKey) ?? [];
  const selectedIsToday = selectedKey === toDateKey(today);
  const dayHeaderLabel = selectedIsToday
    ? `Hoy, ${selectedDate.toLocaleDateString("es-ES", { day: "numeric", month: "long" })}`
    : capitalize(selectedDate.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }));
  const cells = buildMonthCells(calendarMonth.year, calendarMonth.month);

  return (
    <div className="space-y-6">
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-blue/30 bg-blue-50 px-4 py-2.5 text-sm">
          <span className="font-medium text-brand-ink">
            {selectedIds.size} seleccionada{selectedIds.size > 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={() => setConfirmTarget({ mode: "bulk", ids: Array.from(selectedIds) })}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium text-emerald-600 hover:bg-emerald-100"
          >
            <IconCheck className="h-4 w-4" /> Finalizar
          </button>
          <button type="button" onClick={clearSelection} className="ml-auto text-xs text-slate-500 hover:underline">
            Cancelar selección
          </button>
        </div>
      )}

      {overdue.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-display text-lg font-medium text-brand-ink">Vencidas</h2>
          <div className="space-y-2">{overdue.map(renderTask)}</div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="h-fit space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="rounded-md px-2 py-1 text-sm text-slate-400 hover:bg-slate-50 hover:text-brand-ink"
            >
              ←
            </button>
            <span className="font-display text-sm font-medium text-brand-ink">
              {monthLabel(calendarMonth.year, calendarMonth.month)}
            </span>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="rounded-md px-2 py-1 text-sm text-slate-400 hover:bg-slate-50 hover:text-brand-ink"
            >
              →
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-400">
            {WEEKDAY_LABELS.map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((date, i) => {
              if (!date) return <div key={`blank-${i}`} />;
              const key = toDateKey(date);
              const dayTasks = tasksByDay.get(key) ?? [];
              const isToday = key === toDateKey(today);
              const isSelected = key === selectedKey;
              const hasOverdue = dayTasks.some((t) => new Date(t.scheduled_at).getTime() < now);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectDay(date)}
                  className={`relative flex h-9 flex-col items-center justify-center rounded-lg text-xs transition-colors ${
                    isSelected
                      ? "bg-brand-blue font-semibold text-white"
                      : isToday
                        ? "border border-brand-blue font-medium text-brand-ink"
                        : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {date.getDate()}
                  {dayTasks.length > 0 && (
                    <span
                      className={`absolute bottom-1 h-1 w-1 rounded-full ${
                        isSelected ? "bg-white" : hasOverdue ? "bg-red-500" : "bg-brand-blue"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => selectDay(new Date())}
            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-brand-blue hover:bg-blue-50"
          >
            Hoy
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftSelectedDay(-1)}
              className="rounded-md px-2 py-1 text-sm text-slate-400 hover:bg-slate-50 hover:text-brand-ink"
            >
              ←
            </button>
            <h2 className="font-display text-lg font-medium text-brand-ink">{dayHeaderLabel}</h2>
            <button
              type="button"
              onClick={() => shiftSelectedDay(1)}
              className="rounded-md px-2 py-1 text-sm text-slate-400 hover:bg-slate-50 hover:text-brand-ink"
            >
              →
            </button>
          </div>
          <div className="space-y-2">
            {selectedTasks.map(renderTask)}
            {selectedTasks.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-400">
                No hay tareas para este día.
              </p>
            )}
          </div>
        </div>
      </div>

      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <div>
              <h3 className="font-display text-lg font-semibold text-brand-ink">
                {confirmTarget.mode === "bulk"
                  ? `¿Finalizar las ${confirmTarget.ids.length} tareas seleccionadas?`
                  : "¿Finalizar esta tarea?"}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Se marcará como completada y quedará un registro en las notas de la ficha del lead.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmTarget(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleFinalizeConfirm}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Finalizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
