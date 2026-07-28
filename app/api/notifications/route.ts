import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getNotificationsData } from "@/lib/notifications";

export async function GET() {
  const supabase = await createClient();
  const data = await getNotificationsData(supabase);
  return NextResponse.json(data);
}
