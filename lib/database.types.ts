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
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: Database["public"]["Enums"]["user_role"];
          active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          agent_id: string | null;
          baja_at: string | null;
          created_at: string;
          id: string;
          lead_id: string;
          status: Database["public"]["Enums"]["client_status"];
        };
        Insert: {
          agent_id?: string | null;
          baja_at?: string | null;
          created_at?: string;
          id?: string;
          lead_id: string;
          status?: Database["public"]["Enums"]["client_status"];
        };
        Update: {
          agent_id?: string | null;
          baja_at?: string | null;
          created_at?: string;
          id?: string;
          lead_id?: string;
          status?: Database["public"]["Enums"]["client_status"];
        };
        Relationships: [
          {
            foreignKeyName: "clients_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: true;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
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
          cif_nif: string | null;
          ciudad: string | null;
          closed_at: string | null;
          codigo_postal: string | null;
          consentimiento: boolean;
          contacto: string | null;
          created_at: string;
          descripcion: string | null;
          direccion: string | null;
          email: string | null;
          id: string;
          llamadas_semana: string | null;
          negocio: string;
          nombre: string;
          oficio: string | null;
          oficio_otro: string | null;
          owner_id: string | null;
          paid: boolean;
          paid_at: string | null;
          persona_contacto: string | null;
          plan: Database["public"]["Enums"]["lead_plan"] | null;
          provincia: string | null;
          raw_payload: Json | null;
          razon_social: string | null;
          source: Database["public"]["Enums"]["lead_source"];
          status: Database["public"]["Enums"]["lead_status"];
          telefono: string | null;
          updated_at: string;
          voz: string | null;
        };
        Insert: {
          cif_nif?: string | null;
          ciudad?: string | null;
          closed_at?: string | null;
          codigo_postal?: string | null;
          consentimiento?: boolean;
          contacto?: string | null;
          created_at?: string;
          descripcion?: string | null;
          direccion?: string | null;
          email?: string | null;
          id?: string;
          llamadas_semana?: string | null;
          negocio: string;
          nombre: string;
          oficio?: string | null;
          oficio_otro?: string | null;
          owner_id?: string | null;
          paid?: boolean;
          paid_at?: string | null;
          persona_contacto?: string | null;
          plan?: Database["public"]["Enums"]["lead_plan"] | null;
          provincia?: string | null;
          raw_payload?: Json | null;
          razon_social?: string | null;
          source: Database["public"]["Enums"]["lead_source"];
          status?: Database["public"]["Enums"]["lead_status"];
          telefono?: string | null;
          updated_at?: string;
          voz?: string | null;
        };
        Update: {
          cif_nif?: string | null;
          ciudad?: string | null;
          closed_at?: string | null;
          codigo_postal?: string | null;
          consentimiento?: boolean;
          contacto?: string | null;
          created_at?: string;
          descripcion?: string | null;
          direccion?: string | null;
          email?: string | null;
          id?: string;
          llamadas_semana?: string | null;
          negocio?: string;
          nombre?: string;
          oficio?: string | null;
          oficio_otro?: string | null;
          owner_id?: string | null;
          paid?: boolean;
          paid_at?: string | null;
          persona_contacto?: string | null;
          plan?: Database["public"]["Enums"]["lead_plan"] | null;
          provincia?: string | null;
          raw_payload?: Json | null;
          razon_social?: string | null;
          source?: Database["public"]["Enums"]["lead_source"];
          status?: Database["public"]["Enums"]["lead_status"];
          telefono?: string | null;
          updated_at?: string;
          voz?: string | null;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          completed: boolean;
          created_at: string;
          id: string;
          lead_id: string;
          notes: string | null;
          scheduled_at: string;
          type: Database["public"]["Enums"]["task_type"];
        };
        Insert: {
          completed?: boolean;
          created_at?: string;
          id?: string;
          lead_id: string;
          notes?: string | null;
          scheduled_at: string;
          type: Database["public"]["Enums"]["task_type"];
        };
        Update: {
          completed?: boolean;
          created_at?: string;
          id?: string;
          lead_id?: string;
          notes?: string | null;
          scheduled_at?: string;
          type?: Database["public"]["Enums"]["task_type"];
        };
        Relationships: [
          {
            foreignKeyName: "tasks_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      client_status: "activo" | "baja";
      lead_plan: "aprendiz" | "oficial" | "maestro";
      lead_source: "wizard" | "a_medida";
      lead_status:
        | "nuevo"
        | "contactado"
        | "demo_agendada"
        | "demo_hecha"
        | "ganado"
        | "perdido";
      task_type: "llamada" | "demo" | "cierre";
      user_role: "admin" | "comercial";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type LeadNote = Database["public"]["Tables"]["lead_notes"]["Row"];
export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
