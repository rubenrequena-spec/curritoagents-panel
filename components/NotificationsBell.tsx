import { createClient } from "@/lib/supabase/server";
import { getNotificationsData } from "@/lib/notifications";
import { NotificationsBellPanel } from "@/components/NotificationsBellPanel";

export async function NotificationsBell() {
  const supabase = await createClient();
  const { newLeads, dueTasks } = await getNotificationsData(supabase);

  return <NotificationsBellPanel initialNewLeads={newLeads} initialDueTasks={dueTasks} />;
}
