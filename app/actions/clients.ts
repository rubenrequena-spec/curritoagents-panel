"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
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

// Plan lives on the client's lead (leads.plan), not on clients — pricing
// (lib/constants PLAN_PRICES) is always looked up from it, so changing it
// here is enough to update MRR/ingresos everywhere without a separate price
// field.
export async function updateClientPlan(
  clientId: string,
  leadId: string,
  plan: LeadPlan,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("leads").update({ plan }).eq("id", leadId);
  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/clientes");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/dashboard");
  return error ? { success: false, error: error.message } : { success: true };
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
  return { success: true };
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
