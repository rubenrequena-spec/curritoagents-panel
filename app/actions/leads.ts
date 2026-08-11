"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentProfile, isAdmin } from "@/lib/auth";
import { provisionDashboardClient } from "@/lib/n8n";
import { PLAN_MINUTE_LIMITS } from "@/lib/constants";
import type { Database, Lead } from "@/lib/database.types";

type LeadStatus = Database["public"]["Enums"]["lead_status"];
type LeadPlan = Database["public"]["Enums"]["lead_plan"];
type LeadSource = Database["public"]["Enums"]["lead_source"];

export type ActionResult = { success: true } | { success: false; error: string };
export type CreateResult =
  | { success: true; leadId: string }
  | { success: false; error: string };

// Used only by the Pipeline board's per-card StatusSelect, which only ever
// renders open leads (closed ones are excluded from the kanban) — so this
// never needs to read the row first. Rejects "ganado": that transition
// always goes through confirmLeadWon instead, which enforces paid=true.
export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus,
): Promise<ActionResult> {
  if (status === "ganado") {
    return { success: false, error: "Usa confirmLeadWon para marcar un lead como ganado." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ status, closed_at: status === "perdido" ? new Date().toISOString() : null })
    .eq("id", leadId);
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads/[id]", "layout");
  return error ? { success: false, error: error.message } : { success: true };
}

// The only action allowed to set status='ganado'. Called by
// ConfirmWonDialog from both the Pipeline kanban and the lead detail page.
// Atomically sets paid=true alongside status so a lead can never end up
// ganado + unpaid through this flow.
export async function confirmLeadWon(
  leadId: string,
  plan: LeadPlan | null,
): Promise<ActionResult> {
  if (!plan) {
    return { success: false, error: "Selecciona un plan antes de confirmar." };
  }
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("leads")
    .select("paid, paid_at")
    .eq("id", leadId)
    .single();
  const now = new Date().toISOString();
  // Preserve an earlier real payment timestamp if the lead was already
  // marked paid before being marked ganado.
  const paid_at = existing?.paid && existing.paid_at ? existing.paid_at : now;

  const { error } = await supabase
    .from("leads")
    .update({ status: "ganado", paid: true, paid_at, closed_at: now, plan })
    .eq("id", leadId);

  if (!error) {
    // Auto-provisions the client the first time this lead wins. Idempotent:
    // lead_id is unique on clients, so re-confirming an already-ganado lead
    // (e.g. after editing its plan) is a safe no-op, not a duplicate/error.
    const { error: clientError } = await supabase
      .from("clients")
      .upsert({ lead_id: leadId }, { onConflict: "lead_id", ignoreDuplicates: true });
    if (clientError) {
      console.error("Failed to auto-provision client for lead", leadId, clientError);
    }
  }

  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads/[id]", "layout");
  revalidatePath("/clientes");
  return error ? { success: false, error: error.message } : { success: true };
}

// Used by the lead detail page's Guardar button, for any status other than
// "ganado" (that path is rejected — see confirmLeadWon). Reads the current
// row first so paid_at/closed_at only change on real transitions, instead
// of resetting every time unrelated fields are saved.
export async function updateLeadStatusPlanPaid(
  leadId: string,
  input: { status: LeadStatus; plan: LeadPlan | null; paid: boolean },
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("leads")
    .select("status, paid, paid_at, closed_at, negocio, oficio, email, telefono")
    .eq("id", leadId)
    .single();
  if (fetchError || !existing) {
    return { success: false, error: fetchError?.message ?? "Lead no encontrado" };
  }
  // Only reject an actual transition into "ganado" (must go through
  // confirmLeadWon) — an already-ganado lead (i.e. a client) still needs to
  // save this form to tweak plan/paid without touching status.
  if (input.status === "ganado" && existing.status !== "ganado") {
    return { success: false, error: "Usa confirmLeadWon para marcar un lead como ganado." };
  }

  const wasClosed = existing.status === "ganado" || existing.status === "perdido";
  const willBeClosed = input.status === "ganado" || input.status === "perdido";
  let closed_at = existing.closed_at;
  if (!wasClosed && willBeClosed) closed_at = new Date().toISOString();
  if (wasClosed && !willBeClosed) closed_at = null; // reopened

  let paid_at = existing.paid_at;
  if (input.paid && !existing.paid) paid_at = new Date().toISOString();
  if (!input.paid) paid_at = null;

  const { error } = await supabase
    .from("leads")
    .update({ status: input.status, plan: input.plan, paid: input.paid, paid_at, closed_at })
    .eq("id", leadId);
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads/[id]", "layout");
  const { data: client } = await supabase
    .from("clients")
    .select("id, agent_id")
    .eq("lead_id", leadId)
    .maybeSingle();
  if (client) revalidatePath(`/clientes/${client.id}`);
  revalidatePath("/clientes");
  revalidatePath("/dashboard");

  // Keep n8n's clientes_config in sync when the plan changes for an
  // already-linked client — otherwise plan_minutos stays frozen at whatever
  // it was when the agent was first linked (setClientAgentId). Best-effort,
  // same as there: a flaky/down n8n must never undo a successful plan save.
  if (!error && client?.agent_id) {
    await provisionDashboardClient({
      agentId: client.agent_id,
      clientName: existing.negocio,
      oficio: existing.oficio,
      notifyEmail: existing.email,
      whatsappNumber: existing.telefono,
      planMinutos: input.plan ? PLAN_MINUTE_LIMITS[input.plan] : 0,
    });
  }

  return error ? { success: false, error: error.message } : { success: true };
}

export type CreateLeadInput = {
  nombre: string;
  negocio: string;
  email: string | null;
  telefono: string | null;
  contacto: string | null;
  source: LeadSource;
};

// Manual entry point for leads that didn't come from the wizard or n8n —
// e.g. a deal closed by phone/email that a comercial types in directly.
// Owned by whoever creates it (admin can reassign afterwards).
export async function createLeadManual(input: CreateLeadInput): Promise<CreateResult> {
  const nombre = input.nombre.trim();
  const negocio = input.negocio.trim();
  if (!nombre || !negocio) {
    return { success: false, error: "Nombre y negocio son obligatorios." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      nombre,
      negocio,
      email: input.email?.trim() || null,
      telefono: input.telefono?.trim() || null,
      contacto: input.contacto?.trim() || null,
      source: input.source,
      owner_id: user?.id ?? null,
    })
    .select("id")
    .single();
  revalidatePath("/leads");
  if (error || !data) {
    return { success: false, error: error?.message ?? "No se pudo crear el lead." };
  }
  return { success: true, leadId: data.id };
}

// Admin-only reassignment: RLS already enforces this (a comercial's update
// policy requires the new owner_id to still equal their own uid, so this
// silently affects 0 rows for anyone but an admin) — checking here too just
// gives a clear error instead of a silent no-op.
export async function assignLeadOwner(leadId: string, ownerId: string | null): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!isAdmin(profile)) return { success: false, error: "No autorizado." };

  const supabase = await createClient();
  const { error } = await supabase.from("leads").update({ owner_id: ownerId }).eq("id", leadId);
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  return error ? { success: false, error: error.message } : { success: true };
}

export async function addLeadNote(leadId: string, body: string) {
  const trimmed = body.trim();
  if (!trimmed) return;
  const supabase = await createClient();
  await supabase.from("lead_notes").insert({ lead_id: leadId, body: trimmed });
  revalidatePath(`/leads/${leadId}`);
}

export type BillingInput = {
  razonSocial: string | null;
  cifNif: string | null;
  direccion: string | null;
  codigoPostal: string | null;
  provincia: string | null;
  personaContacto: string | null;
};

export async function updateLeadBilling(leadId: string, input: BillingInput): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({
      razon_social: input.razonSocial?.trim() || null,
      cif_nif: input.cifNif?.trim() || null,
      direccion: input.direccion?.trim() || null,
      codigo_postal: input.codigoPostal?.trim() || null,
      provincia: input.provincia?.trim() || null,
      persona_contacto: input.personaContacto?.trim() || null,
    })
    .eq("id", leadId);
  revalidatePath(`/leads/${leadId}`);
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("lead_id", leadId)
    .maybeSingle();
  if (client) revalidatePath(`/clientes/${client.id}`);
  return error ? { success: false, error: error.message } : { success: true };
}

export type GeneralInfoInput = {
  email: string | null;
  telefono: string | null;
};

export async function updateLeadGeneral(
  leadId: string,
  input: GeneralInfoInput,
): Promise<ActionResult> {
  const supabase = await createClient();
  const email = input.email?.trim() || null;
  const telefono = input.telefono?.trim() || null;
  const { error } = await supabase
    .from("leads")
    .update({ email, telefono })
    .eq("id", leadId);
  revalidatePath(`/leads/${leadId}`);
  const { data: client } = await supabase
    .from("clients")
    .select("id, agent_id")
    .eq("lead_id", leadId)
    .maybeSingle();
  if (client) revalidatePath(`/clientes/${client.id}`);
  revalidatePath("/leads");
  revalidatePath("/clientes");

  // Same n8n re-sync as updateLeadStatusPlanPaid, for email/telefono —
  // best-effort, never blocks the save.
  if (!error && client?.agent_id) {
    const { data: lead } = await supabase
      .from("leads")
      .select("negocio, oficio, plan")
      .eq("id", leadId)
      .single();
    if (lead) {
      await provisionDashboardClient({
        agentId: client.agent_id,
        clientName: lead.negocio,
        oficio: lead.oficio,
        notifyEmail: email,
        whatsappNumber: telefono,
        planMinutos: lead.plan ? PLAN_MINUTE_LIMITS[lead.plan as LeadPlan] : 0,
      });
    }
  }

  return error ? { success: false, error: error.message } : { success: true };
}

export async function updateLeadVoz(leadId: string, voz: string | null): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("leads").update({ voz }).eq("id", leadId);
  revalidatePath(`/leads/${leadId}`);
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("lead_id", leadId)
    .maybeSingle();
  if (client) revalidatePath(`/clientes/${client.id}`);
  return error ? { success: false, error: error.message } : { success: true };
}

// Hard delete: cascades to lead_notes, tasks, and clients via FK (on delete
// cascade), so this is the only call needed to fully remove a lead and
// everything derived from it (including its client record, if it won).
export async function deleteLead(
  leadId: string,
  redirectTo: "/leads" | "/clientes",
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("leads").delete().eq("id", leadId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/clientes");
  revalidatePath("/leads/[id]", "layout");
  redirect(redirectTo);
}

export type ExportLeadsFilters = { source?: string; status?: string; q?: string };
export type ExportLeadsResult = { success: true; csv: string } | { success: false; error: string };

const EXPORT_COLUMNS: Array<{ key: keyof Lead; header: string }> = [
  { key: "nombre", header: "Nombre" },
  { key: "negocio", header: "Negocio" },
  { key: "oficio", header: "Oficio" },
  { key: "source", header: "Origen" },
  { key: "status", header: "Estado" },
  { key: "telefono", header: "Telefono" },
  { key: "email", header: "Email" },
  { key: "ciudad", header: "Ciudad" },
  { key: "plan", header: "Plan" },
  { key: "created_at", header: "Fecha" },
];

function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Admin-only: exports the same rows the leads page currently has filtered
// (or everything if unfiltered) as a CSV string, so the client can trigger
// a browser download without a live Google Sheets integration.
export async function exportLeadsToCsv(filters: ExportLeadsFilters): Promise<ExportLeadsResult> {
  const profile = await getCurrentProfile();
  if (!isAdmin(profile)) return { success: false, error: "No autorizado." };

  const supabase = await createClient();
  let query = supabase.from("leads").select("*");
  if (filters.source) query = query.eq("source", filters.source);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.q) {
    const pattern = `"%${filters.q.replace(/"/g, '\\"')}%"`;
    query = query.or(
      `nombre.ilike.${pattern},negocio.ilike.${pattern},email.ilike.${pattern},telefono.ilike.${pattern},contacto.ilike.${pattern}`,
    );
  }
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) return { success: false, error: error.message };

  const rows = (data as Lead[] | null) ?? [];
  const lines = [
    EXPORT_COLUMNS.map((c) => csvEscape(c.header)).join(","),
    ...rows.map((row) => EXPORT_COLUMNS.map((c) => csvEscape(row[c.key])).join(",")),
  ];
  return { success: true, csv: lines.join("\n") };
}
