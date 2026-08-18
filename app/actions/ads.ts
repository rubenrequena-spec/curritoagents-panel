"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ActionResult = { success: true } | { success: false; error: string };

export async function resolveRecommendation(
  id: string,
  status: "applied" | "dismissed",
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("ads_recommendations")
    .update({ status, resolved_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/ads");
  return error ? { success: false, error: error.message } : { success: true };
}

export async function deleteRecommendation(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("ads_recommendations").delete().eq("id", id);
  revalidatePath("/ads");
  return error ? { success: false, error: error.message } : { success: true };
}
