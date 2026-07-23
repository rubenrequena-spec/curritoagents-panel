import { createClient } from "@/lib/supabase/server";
import { SOURCE_LABELS } from "@/lib/constants";
import { StatusSelect } from "@/components/StatusSelect";
import { PlanPaidForm } from "@/components/PlanPaidForm";
import { addLeadNote } from "@/app/actions/leads";
import { notFound } from "next/navigation";
import type { Lead, LeadNote } from "@/lib/database.types";

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

  const { data: notesData } = await supabase
    .from("lead_notes")
    .select("*")
    .eq("lead_id", id)
    .order("created_at", { ascending: false });
  const notes = notesData as LeadNote[] | null;

  async function addNoteAction(formData: FormData) {
    "use server";
    await addLeadNote(id, String(formData.get("body") || ""));
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{lead.nombre}</h1>
        <p className="text-slate-400">
          {lead.negocio} ·{" "}
          <span className="inline-flex rounded-full bg-slate-800 px-2 py-0.5 text-xs">
            {SOURCE_LABELS[lead.source] ?? lead.source}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm">
        <div>
          <span className="text-slate-500">Email</span>
          <div>{lead.email || "—"}</div>
        </div>
        <div>
          <span className="text-slate-500">Teléfono</span>
          <div>{lead.telefono || "—"}</div>
        </div>
        <div>
          <span className="text-slate-500">Contacto</span>
          <div>{lead.contacto || "—"}</div>
        </div>
        <div>
          <span className="text-slate-500">Ciudad</span>
          <div>{lead.ciudad || "—"}</div>
        </div>
        <div>
          <span className="text-slate-500">Oficio</span>
          <div>{lead.oficio || "—"}</div>
        </div>
        <div>
          <span className="text-slate-500">Avisos/semana</span>
          <div>{lead.llamadas_semana || "—"}</div>
        </div>
        <div>
          <span className="text-slate-500">Voz</span>
          <div>{lead.voz || "—"}</div>
        </div>
        <div>
          <span className="text-slate-500">Recibido</span>
          <div>{new Date(lead.created_at).toLocaleString("es-ES")}</div>
        </div>
      </div>

      {lead.descripcion && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm">
          <div className="text-slate-500 mb-1">
            {lead.source === "a_medida" ? "¿Qué necesita?" : "Comentarios"}
          </div>
          <p className="whitespace-pre-wrap">{lead.descripcion}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-8 items-start">
        <div className="space-y-1">
          <div className="text-sm text-slate-500">Estado</div>
          <StatusSelect leadId={lead.id} status={lead.status} />
        </div>
        <PlanPaidForm leadId={lead.id} plan={lead.plan} paid={lead.paid} />
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Notas</h2>
        <form action={addNoteAction} className="flex gap-2">
          <textarea
            name="body"
            required
            rows={2}
            placeholder="Añadir una nota de seguimiento..."
            className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="self-end rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium"
          >
            Añadir
          </button>
        </form>
        <div className="space-y-2">
          {(notes ?? []).map((note) => (
            <div
              key={note.id}
              className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-sm"
            >
              <p className="whitespace-pre-wrap">{note.body}</p>
              <div className="text-xs text-slate-500 mt-1">
                {new Date(note.created_at).toLocaleString("es-ES")}
              </div>
            </div>
          ))}
          {(!notes || notes.length === 0) && (
            <p className="text-sm text-slate-500">Sin notas todavía.</p>
          )}
        </div>
      </div>
    </div>
  );
}
