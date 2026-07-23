"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Database } from "@/lib/database.types";

type LeadStatus = Database["public"]["Enums"]["lead_status"];
type LeadPlan = Database["public"]["Enums"]["lead_plan"];

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const supabase = await createClient();
  await supabase.from("leads").update({ status }).eq("id", leadId);
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath(`/leads/${leadId}`);
}

export async function updateLeadPlanPaid(
  leadId: string,
  plan: LeadPlan | null,
  paid: boolean,
) {
  const supabase = await createClient();
  await supabase
    .from("leads")
    .update({ plan, paid, paid_at: paid ? new Date().toISOString() : null })
    .eq("id", leadId);
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
}

export async function addLeadNote(leadId: string, body: string) {
  const trimmed = body.trim();
  if (!trimmed) return;
  const supabase = await createClient();
  await supabase.from("lead_notes").insert({ lead_id: leadId, body: trimmed });
  revalidatePath(`/leads/${leadId}`);
}
