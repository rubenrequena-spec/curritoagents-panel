export const STATUS_ORDER = [
  "nuevo",
  "contactado",
  "demo_agendada",
  "demo_hecha",
  "ganado",
  "perdido",
] as const;

export const CLOSED_STATUSES = ["ganado", "perdido"] as const;

export const PIPELINE_STATUS_ORDER = [
  "nuevo",
  "contactado",
  "demo_agendada",
  "demo_hecha",
] as const;

export const STATUS_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  demo_agendada: "Demo agendada",
  demo_hecha: "Demo hecha",
  ganado: "Activado",
  perdido: "Perdido",
};

export const SOURCE_LABELS: Record<string, string> = {
  wizard: "Configura tu agente",
  a_medida: "Hecho a medida",
  demo_call: "Llamada a la demo",
};

export const PLAN_LABELS: Record<string, string> = {
  aprendiz: "Aprendiz",
  oficial: "Oficial",
  maestro: "Maestro",
};

export const STATUS_STYLES: Record<string, string> = {
  nuevo: "bg-slate-100 text-slate-600 border-slate-200",
  contactado: "bg-blue-50 text-brand-blue border-blue-100",
  demo_agendada: "bg-indigo-50 text-indigo-600 border-indigo-100",
  demo_hecha: "bg-amber-50 text-amber-700 border-amber-200",
  ganado: "bg-emerald-50 text-emerald-700 border-emerald-200",
  perdido: "bg-red-50 text-red-600 border-red-100",
};

export const STATUS_DOT: Record<string, string> = {
  nuevo: "bg-slate-400",
  contactado: "bg-brand-blue",
  demo_agendada: "bg-indigo-500",
  demo_hecha: "bg-amber-500",
  ganado: "bg-emerald-500",
  perdido: "bg-red-500",
};

export const SOURCE_STYLES: Record<string, string> = {
  wizard: "bg-blue-50 text-brand-blue border-blue-100",
  a_medida: "bg-orange-50 text-brand-orange border-orange-100",
  demo_call: "bg-indigo-50 text-indigo-600 border-indigo-100",
};

export const TASK_TYPE_ORDER = ["llamada", "demo", "cierre"] as const;

export const TASK_TYPE_LABELS: Record<string, string> = {
  llamada: "Llamada",
  demo: "Demo",
  cierre: "Cierre",
};

export const TASK_TYPE_STYLES: Record<string, string> = {
  llamada: "bg-blue-50 text-brand-blue border-blue-100",
  demo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  cierre: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export const TASK_DUE_WINDOW_HOURS = 48;

export const PLAN_MINUTE_LIMITS: Record<"aprendiz" | "oficial" | "maestro", number> = {
  aprendiz: 60,
  oficial: 180,
  maestro: 400,
};

// Precios estándar +IVA no incluido; no reflejan promociones temporales.
export const PLAN_PRICES: Record<"aprendiz" | "oficial" | "maestro", number> = {
  aprendiz: 99,
  oficial: 199,
  maestro: 399,
};

export const VOZ_OPTIONS = ["Javier", "Laura", "Roberto", "Rodrigo"] as const;

export const CLIENT_STATUS_LABELS: Record<"activo" | "baja", string> = {
  activo: "Activo",
  baja: "Baja",
};

export const CLIENT_STATUS_STYLES: Record<"activo" | "baja", string> = {
  activo: "bg-emerald-50 text-emerald-700 border-emerald-200",
  baja: "bg-slate-100 text-slate-600 border-slate-200",
};
