"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { provisionDashboardClient } from "@/lib/n8n";
import { PLAN_MINUTE_LIMITS } from "@/lib/constants";
import type { Database } from "@/lib/database.types";

type ClientStatus = Database["public"]["Enums"]["client_status"];
type LeadPlan = Database["public"]["Enums"]["lead_plan"];
type LeadSource = Database["public"]["Enums"]["lead_source"];

export type ActionResult = { success: true } | { success: false; error: string };
export type CreateClientResult =
  | { success: true; clientId: string }
  | { success: false; error: string };

export type CreateClientInput = {
  nombre: string;
  negocio: string;
  email: string | null;
  telefono: string | null;
  plan: LeadPlan;
  source: LeadSource;
};

// Manual "alta directa": registers a client without going through the
// pipeline — creates its underlying lead already ganado+paid with the
// chosen plan, then provisions the client row, same invariant confirmLeadWon
// enforces (a lead can never be ganado without paid=true here).
export async function createClientManual(input: CreateClientInput): Promise<CreateClientResult> {
  const nombre = input.nombre.trim();
  const negocio = input.negocio.trim();
  if (!nombre || !negocio) {
    return { success: false, error: "Nombre y negocio son obligatorios." };
  }
  const supabase = await createClient();
  const now = new Date().toISOString();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .insert({
      nombre,
      negocio,
      email: input.email?.trim() || null,
      telefono: input.telefono?.trim() || null,
      source: input.source,
      status: "ganado",
      plan: input.plan,
      paid: true,
      paid_at: now,
      closed_at: now,
      owner_id: user?.id ?? null,
    })
    .select("id")
    .single();
  if (leadError || !lead) {
    return { success: false, error: leadError?.message ?? "No se pudo crear el lead." };
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({ lead_id: lead.id })
    .select("id")
    .single();

  revalidatePath("/clientes");
  revalidatePath("/leads");
  revalidatePath("/dashboard");
  if (clientError || !client) {
    return { success: false, error: clientError?.message ?? "No se pudo crear el cliente." };
  }
  return { success: true, clientId: client.id };
}

export async function setClientAgentId(
  clientId: string,
  agentId: string | null,
): Promise<ActionResult> {
  const supabase = await createClient();
  const trimmed = agentId?.trim() || null;
  const { error } = await supabase.from("clients").update({ agent_id: trimmed }).eq("id", clientId);
  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/clientes");
  if (error) {
    const friendly =
      error.code === "23505" ? "Este agent_id ya está vinculado a otro cliente." : error.message;
    return { success: false, error: friendly };
  }

  // Provision (or, if it already exists, just fetch) this agent's row in
  // n8n's clientes_config so the public dashboard link works without Rubén
  // having to create it by hand in n8n every time. Best-effort: a flaky/down
  // n8n must never undo a successful agent_id link.
  if (trimmed) {
    const { data: client } = await supabase
      .from("clients")
      .select("lead:leads(negocio, oficio, email, telefono, plan)")
      .eq("id", clientId)
      .single();
    const lead = client?.lead as unknown as
      | {
          negocio: string;
          oficio: string | null;
          email: string | null;
          telefono: string | null;
          plan: LeadPlan | null;
        }
      | null;
    if (lead) {
      const provisioned = await provisionDashboardClient({
        agentId: trimmed,
        clientName: lead.negocio,
        oficio: lead.oficio,
        notifyEmail: lead.email,
        whatsappNumber: lead.telefono,
        planMinutos: lead.plan ? PLAN_MINUTE_LIMITS[lead.plan] : 0,
      });
      if (provisioned) {
        await supabase
          .from("clients")
          .update({ dashboard_token: provisioned.dashboardToken })
          .eq("id", clientId);
        revalidatePath(`/clientes/${clientId}`);
      }
    }
  }

  return { success: true };
}

export async function setClientPhoneNumber(
  clientId: string,
  phoneNumber: string | null,
): Promise<ActionResult> {
  const supabase = await createClient();
  const trimmed = phoneNumber?.trim() || null;
  const { error } = await supabase
    .from("clients")
    .update({ phone_number: trimmed })
    .eq("id", clientId);
  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/clientes");
  return error ? { success: false, error: error.message } : { success: true };
}

export async function setClientStatus(
  clientId: string,
  status: ClientStatus,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({ status, baja_at: status === "baja" ? new Date().toISOString() : null })
    .eq("id", clientId);
  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/clientes");
  revalidatePath("/dashboard");
  return error ? { success: false, error: error.message } : { success: true };
}
