export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      lead_notes: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          lead_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          lead_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          lead_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          ciudad: string | null;
          consentimiento: boolean;
          contacto: string | null;
          created_at: string;
          descripcion: string | null;
          email: string | null;
          id: string;
          llamadas_semana: string | null;
          negocio: string;
          nombre: string;
          oficio: string | null;
          oficio_otro: string | null;
          paid: boolean;
          paid_at: string | null;
          plan: Database["public"]["Enums"]["lead_plan"] | null;
          raw_payload: Json | null;
          source: Database["public"]["Enums"]["lead_source"];
          status: Database["public"]["Enums"]["lead_status"];
          telefono: string | null;
          updated_at: string;
          voz: string | null;
        };
        Insert: {
          ciudad?: string | null;
          consentimiento?: boolean;
          contacto?: string | null;
          created_at?: string;
          descripcion?: string | null;
          email?: string | null;
          id?: string;
          llamadas_semana?: string | null;
          negocio: string;
          nombre: string;
          oficio?: string | null;
          oficio_otro?: string | null;
          paid?: boolean;
          paid_at?: string | null;
          plan?: Database["public"]["Enums"]["lead_plan"] | null;
          raw_payload?: Json | null;
          source: Database["public"]["Enums"]["lead_source"];
          status?: Database["public"]["Enums"]["lead_status"];
          telefono?: string | null;
          updated_at?: string;
          voz?: string | null;
        };
        Update: {
          ciudad?: string | null;
          consentimiento?: boolean;
          contacto?: string | null;
          created_at?: string;
          descripcion?: string | null;
          email?: string | null;
          id?: string;
          llamadas_semana?: string | null;
          negocio?: string;
          nombre?: string;
          oficio?: string | null;
          oficio_otro?: string | null;
          paid?: boolean;
          paid_at?: string | null;
          plan?: Database["public"]["Enums"]["lead_plan"] | null;
          raw_payload?: Json | null;
          source?: Database["public"]["Enums"]["lead_source"];
          status?: Database["public"]["Enums"]["lead_status"];
          telefono?: string | null;
          updated_at?: string;
          voz?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      lead_plan: "aprendiz" | "oficial" | "maestro";
      lead_source: "wizard" | "a_medida";
      lead_status:
        | "nuevo"
        | "contactado"
        | "demo_agendada"
        | "demo_hecha"
        | "ganado"
        | "perdido";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type LeadNote = Database["public"]["Tables"]["lead_notes"]["Row"];
