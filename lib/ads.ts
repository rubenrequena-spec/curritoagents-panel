import type { Json } from "@/lib/database.types";

export const META_PLATFORM_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  audience_network: "Audience Network",
  messenger: "Messenger",
};

export function extraString(extra: Json, key: string): string | null {
  if (extra !== null && typeof extra === "object" && !Array.isArray(extra)) {
    const value = (extra as Record<string, Json | undefined>)[key];
    if (typeof value === "string") return value;
  }
  return null;
}
