"use client";

import { useState, useTransition } from "react";
import { createTask, setTaskCompleted, deleteTask } from "@/app/actions/tasks";
import { TASK_TYPE_ORDER, TASK_TYPE_LABELS, TASK_TYPE_STYLES } from "@/lib/constants";
import { Badge } from "@/components/Badge";
import type { Database, Task } from "@/lib/database.types";

type TaskType = Database["public"]["Enums"]["task_type"];

// datetime-local inputs want "YYYY-MM-DDTHH:mm" in the browser's local time,
// no timezone suffix — used as `min` so past dates can't even be picked.
function nowForDatetimeLocal(): string {
  const d = new Date();
  d.setSeconds(0, 0);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

export function LeadTasks({
  leadId,
  initialTasks,
}: {
  leadId: string;
  initialTasks: Task[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [type, setType] = useState<TaskType>("llamada");
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [isCreating, startCreating] = useTransition();
  const [createError, setCreateError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const pending = tasks.filter((t) => !t.completed).sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  const completed = tasks.filter((t) => t.completed).sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at));
  const now = Date.now();

  const handleCreate = () => {
    if (!scheduledAt) return;
    if (new Date(scheduledAt).getTime() < Date.now()) {
      setCreateError("No se pueden agendar tareas en el pasado.");
      return;
    }
    setCreateError(null);
    startCreating(async () => {
      const result = await createTask(leadId, {
        type,
        scheduledAt: new Date(scheduledAt).toISOString(),
        notes: notes || null,
      });
      if (result.success) {
        setTasks((prev) => [...prev, result.task]);
        setScheduledAt("");
        setNotes("");
        setType("llamada");
      } else {
        setCreateError(result.error);
      }
    });
  };

  const handleToggle = (task: Task) => {
    setPendingId(task.id);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t)));
    setTaskCompleted(task.id, leadId, !task.completed).finally(() => setPendingId(null));
  };

  const handleDelete = (task: Task) => {
    if (!confirm("¿Eliminar esta tarea?")) return;
    setPendingId(task.id);
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    deleteTask(task.id, leadId).finally(() => setPendingId(null));
  };

  const renderTask = (task: Task) => {
    const overdue = !task.completed && new Date(task.scheduled_at).getTime() < now;
    return (
      <div
        key={task.id}
        id={`tarea-${task.id}`}
        className={`flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm scroll-mt-24 ${
          overdue ? "border-l-2 border-l-red-400" : ""
        }`}
      >
        <input
          type="checkbox"
          checked={task.completed}
          disabled={pendingId === task.id}
          onChange={() => handleToggle(task)}
          className="mt-0.5 accent-brand-blue"
        />
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Badge className={TASK_TYPE_STYLES[task.type]}>{TASK_TYPE_LABELS[task.type]}</Badge>
            <span className={`text-xs ${overdue ? "font-medium text-red-600" : "text-slate-500"}`}>
              {new Date(task.scheduled_at).toLocaleString("es-ES", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>
          {task.notes && (
            <p className={`whitespace-pre-wrap ${task.completed ? "text-slate-400 line-through" : "text-brand-ink"}`}>
              {task.notes}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => handleDelete(task)}
          disabled={pendingId === task.id}
          className="text-xs text-red-500 hover:underline disabled:opacity-50"
        >
          Eliminar
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <h2 className="font-display text-lg font-medium text-brand-ink">Tareas</h2>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="space-y-1">
          <div className="text-xs text-slate-500">Tipo</div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as TaskType)}
            disabled={isCreating}
            className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-brand-ink outline-none focus:border-brand-blue disabled:opacity-50"
          >
            {TASK_TYPE_ORDER.map((t) => (
              <option key={t} value={t}>
                {TASK_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-slate-500">Fecha y hora</div>
          <input
            type="datetime-local"
            value={scheduledAt}
            min={nowForDatetimeLocal()}
            onChange={(e) => setScheduledAt(e.target.value)}
            disabled={isCreating}
            required
            className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-brand-ink outline-none focus:border-brand-blue disabled:opacity-50"
          />
        </div>
        <div className="flex-1 min-w-[180px] space-y-1">
          <div className="text-xs text-slate-500">Notas (opcional)</div>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isCreating}
            className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-brand-ink outline-none focus:border-brand-blue disabled:opacity-50"
          />
        </div>
        <button
          type="button"
          onClick={handleCreate}
          disabled={isCreating || !scheduledAt}
          className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
        >
          {isCreating ? "Añadiendo..." : "Añadir tarea"}
        </button>
        {createError && <p className="w-full text-xs text-red-500">{createError}</p>}
      </div>

      <div className="space-y-2">
        {pending.map(renderTask)}
        {completed.map(renderTask)}
        {tasks.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-400">
            Sin tareas todavía.
          </p>
        )}
      </div>
    </div>
  );
}
