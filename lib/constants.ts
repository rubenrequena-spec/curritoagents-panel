export const STATUS_ORDER = [
  "nuevo",
  "contactado",
  "demo_agendada",
  "demo_hecha",
  "ganado",
  "perdido",
] as const;

export const STATUS_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  demo_agendada: "Demo agendada",
  demo_hecha: "Demo hecha",
  ganado: "Ganado",
  perdido: "Perdido",
};

export const SOURCE_LABELS: Record<string, string> = {
  wizard: "Configura tu agente",
  a_medida: "Hecho a medida",
};

export const PLAN_LABELS: Record<string, string> = {
  aprendiz: "Aprendiz",
  oficial: "Oficial",
  maestro: "Maestro",
};
