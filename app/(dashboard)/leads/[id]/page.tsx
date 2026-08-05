import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SOURCE_LABELS, SOURCE_STYLES } from "@/lib/constants";
import { LeadStatusPlanForm } from "@/components/LeadStatusPlanForm";
import { GeneralInfoForm } from "@/components/GeneralInfoForm";
import { BillingForm } from "@/components/BillingForm";
import { LeadTasks } from "@/components/LeadTasks";
import { VoiceSelect } from "@/components/VoiceSelect";
import { DeleteLeadButton } from "@/components/DeleteLeadButton";
import { AssignLeadControl } from "@/components/AssignLeadControl";
import { Badge, Avatar } from "@/components/Badge";
import { IconArrowLeft } from "@/components/icons";
import { addLeadNote } from "@/app/actions/leads";
import { getCurrentProfile, isAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import type { Lead, LeadNote, Task, Profile } from "@/lib/database.types";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("leads").select("*").eq("id", id).single();
  const lead = data as Lead | null;
  if (!lead) notFound();

  const profile = await getCurrentProfile();
  const admin = isAdmin(profile);
  let members: { id: string; label: string }[] = [];
  if (admin) {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .eq("active", true)
      .order("full_name", { ascending: true });
    members = ((profilesData as Profile[] | null) ?? []).map((p) => ({
      id: p.id,
      label: p.full_name || p.email,
    }));
  }

  const { data: notesData } = await supabase
    .from("lead_notes")
    .select("*")
    .eq("lead_id", id)
    .order("created_at", { ascending: false });
  const notes = notesData as LeadNote[] | null;

  const { data: tasksData } = await supabase
    .from("tasks")
    .select("*")
    .eq("lead_id", id)
    .order("scheduled_at", { ascending: true });
  const tasks = (tasksData as Task[] | null) ?? [];

  async function addNoteAction(formData: FormData) {
    "use server";
    await addLeadNote(id, String(formData.get("body") || ""));
  }

  const readOnlyFields: [string, string | null][] = [
    ["Contacto", lead.contacto],
    ["Ciudad", lead.ciudad],
    ["Oficio", lead.oficio],
    ["Avisos/semana", lead.llamadas_semana],
    ["Recibido", new Date(lead.created_at).toLocaleString("es-ES")],
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/leads"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-blue"
      >
        <IconArrowLeft className="h-4 w-4" />
        Volver a leads
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
        {admin && (
          <div className="ml-auto">
            <AssignLeadControl leadId={lead.id} ownerId={lead.owner_id} members={members} />
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
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
      </div>

      <LeadStatusPlanForm
        leadId={lead.id}
        status={lead.status}
        plan={lead.plan}
        paid={lead.paid}
      />

      {lead.descripcion && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-sm">
          <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">
            {lead.source === "a_medida" ? "¿Qué necesita?" : "Comentarios"}
          </div>
          <p className="whitespace-pre-wrap text-brand-ink">{lead.descripcion}</p>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="font-display text-lg font-medium text-brand-ink">Notas</h2>
        <form
          action={addNoteAction}
          className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
        >
          <textarea
            name="body"
            required
            rows={2}
            placeholder="Añadir una nota de seguimiento..."
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-brand-ink outline-none focus:border-brand-blue"
          />
          <button
            type="submit"
            className="self-end rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
          >
            Añadir
          </button>
        </form>
        <div className="space-y-2">
          {(notes ?? []).map((note) => (
            <div
              key={note.id}
              className="rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm"
            >
              <p className="whitespace-pre-wrap text-brand-ink">{note.body}</p>
              <div className="mt-1 text-xs text-slate-400">
                {new Date(note.created_at).toLocaleString("es-ES")}
              </div>
            </div>
          ))}
          {(!notes || notes.length === 0) && (
            <p className="text-sm text-slate-400">Sin notas todavía.</p>
          )}
        </div>
      </div>

      <LeadTasks leadId={lead.id} initialTasks={tasks} />

      {admin && <DeleteLeadButton leadId={lead.id} label="este lead" redirectTo="/leads" />}
    </div>
  );
}
