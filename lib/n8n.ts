// Server-only. Never throw: a page must not 500 just because n8n is
// slow/down/misconfigured. `null` = couldn't get an answer at all
// (network/timeout/bad shape). { status: "not_found" } = n8n answered
// fine but this agent_id isn't a known agent (almost certainly a typo).
// { status: "ok", ... } = a real answer, including legitimately 0 minutes.
export type MinutesUsed =
  | { status: "ok"; totalSeconds: number; callCount: number }
  | { status: "not_found" };

const TIMEOUT_MS = 8000;

export async function getMinutesUsed(agentId: string, month: string): Promise<MinutesUsed | null> {
  const url = process.env.N8N_MINUTES_WEBHOOK_URL;
  const secret = process.env.N8N_MINUTES_WEBHOOK_SECRET;
  if (!url || !secret) {
    console.error("N8N_MINUTES_WEBHOOK_URL/N8N_MINUTES_WEBHOOK_SECRET not configured");
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const endpoint = new URL(url);
    endpoint.searchParams.set("agent_id", agentId);
    endpoint.searchParams.set("month", month);

    const res = await fetch(endpoint, {
      method: "GET",
      headers: { "x-webhook-secret": secret },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("n8n minutes webhook returned", res.status);
      return null;
    }
    const body = await res.json();
    if (body?.agent_found === false) return { status: "not_found" };

    const totalSeconds = Number(body?.total_seconds);
    const callCount = Number(body?.call_count);
    if (body?.agent_found !== true || !Number.isFinite(totalSeconds) || !Number.isFinite(callCount)) {
      console.error("n8n minutes webhook returned unexpected shape", body);
      return null;
    }
    return { status: "ok", totalSeconds, callCount };
  } catch (err) {
    console.error("n8n minutes webhook fetch failed", err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Server-only. Never throw: linking an agent_id must still succeed in
// Supabase even if n8n is slow/down/misconfigured. `null` = couldn't
// provision (network/timeout/bad shape) — caller keeps agent_id linked
// and just leaves dashboard_token unset for now.
export type ProvisionDashboardResult = { dashboardToken: string; created: boolean };

export type ProvisionDashboardInput = {
  agentId: string;
  clientName: string;
  oficio: string | null;
  notifyEmail: string | null;
  whatsappNumber: string | null;
  planMinutos: number;
};

export async function provisionDashboardClient(
  input: ProvisionDashboardInput,
): Promise<ProvisionDashboardResult | null> {
  const url = process.env.N8N_PROVISION_DASHBOARD_WEBHOOK_URL;
  const secret = process.env.N8N_PROVISION_DASHBOARD_WEBHOOK_SECRET;
  if (!url || !secret) {
    console.error(
      "N8N_PROVISION_DASHBOARD_WEBHOOK_URL/N8N_PROVISION_DASHBOARD_WEBHOOK_SECRET not configured",
    );
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-webhook-secret": secret },
      body: JSON.stringify({
        agent_id: input.agentId,
        client_name: input.clientName,
        oficio: input.oficio ?? "",
        notify_email: input.notifyEmail ?? "",
        whatsapp_number: input.whatsappNumber ?? "",
        plan_minutos: input.planMinutos,
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("n8n provision-dashboard webhook returned", res.status);
      return null;
    }
    const body = await res.json();
    if (body?.success !== true || typeof body?.dashboard_token !== "string" || !body.dashboard_token) {
      console.error("n8n provision-dashboard webhook returned unexpected shape", body);
      return null;
    }
    return { dashboardToken: body.dashboard_token, created: body?.created === true };
  } catch (err) {
    console.error("n8n provision-dashboard webhook fetch failed", err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
