import { createClient } from "@/lib/supabase/server";
import { TasksAgenda, type TaskWithLead } from "@/components/TasksAgenda";

export default async function TareasPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("tasks")
    .select("id, type, scheduled_at, notes, completed, lead_id, lead:leads(id, nombre, negocio)")
    .eq("completed", false)
    .order("scheduled_at", { ascending: true });

  const tasks = (data ?? []) as unknown as TaskWithLead[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-brand-ink">Tareas</h1>
        <p className="text-sm text-slate-500">
          Agenda diaria de todas las llamadas, demos y cierres programados, con aviso de las vencidas.
        </p>
      </div>

      <TasksAgenda initialTasks={tasks} />
    </div>
  );
}
