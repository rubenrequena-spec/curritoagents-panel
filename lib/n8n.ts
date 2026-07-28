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
