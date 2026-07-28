"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Database, Task } from "@/lib/database.types";

type TaskType = Database["public"]["Enums"]["task_type"];

export type ActionResult = { success: true } | { success: false; error: string };
export type CreateTaskResult = { success: true; task: Task } | { success: false; error: string };

async function revalidateTaskViews(
  supabase: Awaited<ReturnType<typeof createClient>>,
  leadId: string,
) {
  revalidatePath(`/leads/${leadId}`);
  // The dashboard layout (where NotificationsBell lives) doesn't re-render
  // on every sibling navigation by default — this forces it to.
  revalidatePath("/leads/[id]", "layout");
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("lead_id", leadId)
    .maybeSingle();
  if (client) revalidatePath(`/clientes/${client.id}`);
}

export async function createTask(
  leadId: string,
  input: { type: TaskType; scheduledAt: string; notes: string | null },
): Promise<CreateTaskResult> {
  if (new Date(input.scheduledAt).getTime() < Date.now()) {
    return { success: false, error: "No se pueden agendar tareas en el pasado." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      lead_id: leadId,
      type: input.type,
      scheduled_at: input.scheduledAt,
      notes: input.notes?.trim() || null,
    })
    .select()
    .single();
  await revalidateTaskViews(supabase, leadId);
  if (error || !data) {
    return { success: false, error: error?.message ?? "No se pudo crear la tarea" };
  }
  return { success: true, task: data as Task };
}

export async function setTaskCompleted(
  taskId: string,
  leadId: string,
  completed: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").update({ completed }).eq("id", taskId);
  await revalidateTaskViews(supabase, leadId);
  return error ? { success: false, error: error.message } : { success: true };
}

export async function deleteTask(taskId: string, leadId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  await revalidateTaskViews(supabase, leadId);
  return error ? { success: false, error: error.message } : { success: true };
}
