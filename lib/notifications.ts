import type { SupabaseClient } from "@supabase/supabase-js";
import { TASK_DUE_WINDOW_HOURS } from "@/lib/constants";
import type { Database } from "@/lib/database.types";

type TaskType = Database["public"]["Enums"]["task_type"];

export type NewLeadItem = {
  id: string;
  nombre: string;
  negocio: string;
  created_at: string;
};

export type DueTaskItem = {
  id: string;
  type: TaskType;
  scheduled_at: string;
  lead: { id: string; nombre: string; negocio: string } | null;
};

export type NotificationsData = {
  newLeads: NewLeadItem[];
  dueTasks: DueTaskItem[];
};

// Shared by the layout's initial server render (NotificationsBell) and the
// polling API route (app/api/notifications) so both stay in sync.
export async function getNotificationsData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
): Promise<NotificationsData> {
  const horizon = new Date(Date.now() + TASK_DUE_WINDOW_HOURS * 3600_000).toISOString();

  const [{ data: newLeadsData }, { data: dueTasksData }] = await Promise.all([
    supabase
      .from("leads")
      .select("id, nombre, negocio, created_at")
      .eq("status", "nuevo")
      .order("created_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("id, type, scheduled_at, lead:leads(id, nombre, negocio)")
      .eq("completed", false)
      .lte("scheduled_at", horizon)
      .order("scheduled_at", { ascending: true }),
  ]);

  return {
    newLeads: (newLeadsData ?? []) as NewLeadItem[],
    dueTasks: (dueTasksData ?? []) as unknown as DueTaskItem[],
  };
}
