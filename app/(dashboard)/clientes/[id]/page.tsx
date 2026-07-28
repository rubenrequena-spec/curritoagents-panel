import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SOURCE_LABELS, SOURCE_STYLES, PLAN_LABELS, PLAN_MINUTE_LIMITS } from "@/lib/constants";
import { currentMonthValue, formatMonthLabel } from "@/lib/month";
import { getMinutesUsed } from "@/lib/n8n";
import { setClientAgentId } from "@/app/actions/clients";
import { LeadTasks } from "@/components/LeadTasks";
import { GeneralInfoForm } from "@/components/GeneralInfoForm";
import { BillingForm } from "@/components/BillingForm";
import { VoiceSelect } from "@/components/VoiceSelect";
import { DeleteLeadButton } from "@/components/DeleteLeadButton";
import { ClientStatusControl } from "@/components/ClientStatusControl";
import { ChangePlanControl } from "@/components/ChangePlanControl";
import { Badge, Avatar } from "@/components/Badge";
import { IconArrowLeft } from "@/components/icons";
import { getCurrentProfile, isAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import type { Client, Lead, Task } from "@/lib/database.types";

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("*, lead:leads(*)")
    .eq("id", id)
    .single();
  const client = data as (Client & { lead: Lead }) | null;
  if (!client) notFound();

  const profile = await getCurrentProfile();
  const admin = isAdmin(profile);

  const lead = client.lead;

  const { data: tasksData } = await supabase
    .from("tasks")
    .select("*")
    .eq("lead_id", lead.id)
    .order("scheduled_at", { ascending: true });
  const tasks = (tasksData as Task[] | null) ?? [];

  const month = currentMonthValue();
  const minutes = client.agent_id ? await getMinutesUsed(client.agent_id, month) : null;

  async function setAgentIdAction(formData: FormData) {
    "use server";
    await setClientAgentId(client!.id, String(formData.get("agent_id") || ""));
  }

  const readOnlyFields: [string, string | null][] = [
    ["Contacto", lead.contacto],
    ["Ciudad", lead.ciudad],
    ["Oficio", lead.oficio],
    ["Avisos/semana", lead.llamadas_semana],
    ["Plan", lead.plan ? PLAN_LABELS[lead.plan] : null],
    ["Cliente desde", new Date(client.created_at).toLocaleDateString("es-ES")],
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/clientes"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-blue"
      >
        <IconArrowLeft className="h-4 w-4" />
        Volver a clientes
      </Link>

      <div className="flex items-center gap-4">
        <Avatar name={lead.nombre} className="h-12 w-12 text-base" />
        <div>
          <h1 className="font-display text-2xl font-semibold text-brand-ink">{lead.nombre}</h1>
          <p className="flex items-center gap-2 text-sm text-slate-500">
            {lead.negocio}
            <Badge className={SOURCE_STYLES[lead.source]}>
              {SOURCE_LABELS[lead.source] ?? lead.source}
            </Badge>
          </p>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <ChangePlanControl clientId={client.id} leadId={lead.id} plan={lead.plan} />
          <ClientStatusControl clientId={client.id} status={client.status} />
        </div>
      </div>

      <GeneralInfoForm
        leadId={lead.id}
        email={lead.email}
        telefono={lead.telefono}
        readOnlyFields={readOnlyFields}
      >
        <VoiceSelect leadId={lead.id} voz={lead.voz} />
      </GeneralInfoForm>

      <BillingForm
        leadId={lead.id}
        razonSocial={lead.razon_social}
        cifNif={lead.cif_nif}
        direccion={lead.direccion}
        codigoPostal={lead.codigo_postal}
        provincia={lead.provincia}
        personaContacto={lead.persona_contacto}
      />

      <Link
        href={`/leads/${lead.id}`}
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
      >
        Ver ficha completa del lead →
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-medium text-brand-ink">Minutos este mes</h2>
          <span className="text-xs text-slate-400">{formatMonthLabel(month)}</span>
        </div>

        {!client.agent_id ? (
          <form action={setAgentIdAction} className="flex flex-wrap items-center gap-2">
            <input
              name="agent_id"
              placeholder="agent_id de Retell/n8n"
              required
              className="flex-1 min-w-[200px] rounded-lg border border-slate-200 px-3 py-2 text-sm text-brand-ink outline-none focus:border-brand-blue"
            />
            <button
              type="submit"
              className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
            >
              Vincular
            </button>
          </form>
        ) : minutes === null ? (
          <p className="text-amber-600">No se pudo conectar con n8n. Inténtalo de nuevo más tarde.</p>
        ) : minutes.status === "not_found" ? (
          <div className="space-y-2">
            <p className="text-red-500">
              Este agent_id no existe en la configuración de n8n. Revisa que esté bien escrito.
            </p>
            <form action={setAgentIdAction} className="flex flex-wrap items-center gap-2">
              <input
                name="agent_id"
                defaultValue={client.agent_id}
                required
                className="flex-1 min-w-[200px] rounded-lg border border-slate-200 px-3 py-2 text-sm text-brand-ink outline-none focus:border-brand-blue"
              />
              <button
                type="submit"
                className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
              >
                Actualizar
              </button>
            </form>
          </div>
        ) : (
          (() => {
            const usedMin = Math.round(minutes.totalSeconds / 60);
            const limit = lead.plan ? PLAN_MINUTE_LIMITS[lead.plan] : null;
            const pct = limit ? Math.min(100, Math.round((usedMin / limit) * 100)) : null;
            const barColor = pct === null ? "" : pct >= 100 ? "bg-red-500" : pct >= 90 ? "bg-amber-500" : "bg-brand-blue";
            return (
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-xl font-semibold text-brand-ink">
                    {usedMin} {limit ? `/ ${limit} min` : "min"}
                  </span>
                  <span className="text-xs text-slate-400">{minutes.callCount} llamadas</span>
                </div>
                {limit ? (
                  <>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                    {pct !== null && pct >= 100 && (
                      <p className="text-xs font-medium text-red-600">Límite del plan superado.</p>
                    )}
                    {pct !== null && pct >= 90 && pct < 100 && (
                      <p className="text-xs font-medium text-amber-600">Cerca del límite del plan.</p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-slate-400">Sin plan asignado: no se puede calcular el límite.</p>
                )}
              </div>
            );
          })()
        )}
      </div>

      <LeadTasks leadId={lead.id} initialTasks={tasks} />

      {admin && <DeleteLeadButton leadId={lead.id} label="este cliente" redirectTo="/clientes" />}
    </div>
  );
}
