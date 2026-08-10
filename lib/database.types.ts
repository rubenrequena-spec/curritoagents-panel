export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          agent_id: string | null
          baja_at: string | null
          created_at: string
          dashboard_token: string | null
          id: string
          lead_id: string
          phone_number: string | null
          status: Database["public"]["Enums"]["client_status"]
        }
        Insert: {
          agent_id?: string | null
          baja_at?: string | null
          created_at?: string
          dashboard_token?: string | null
          id?: string
          lead_id: string
          phone_number?: string | null
          status?: Database["public"]["Enums"]["client_status"]
        }
        Update: {
          agent_id?: string | null
          baja_at?: string | null
          created_at?: string
          dashboard_token?: string | null
          id?: string
          lead_id?: string
          phone_number?: string | null
          status?: Database["public"]["Enums"]["client_status"]
        }
        Relationships: [
          {
            foreignKeyName: "clients_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notes: {
        Row: {
          body: string
          created_at: string
          id: string
          lead_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          lead_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          cif_nif: string | null
          ciudad: string | null
          closed_at: string | null
          codigo_postal: string | null
          consentimiento: boolean
          contacto: string | null
          created_at: string
          descripcion: string | null
          direccion: string | null
          email: string | null
          id: string
          llamadas_semana: string | null
          negocio: string
          nombre: string
          oficio: string | null
          oficio_otro: string | null
          owner_id: string | null
          paid: boolean
          paid_at: string | null
          persona_contacto: string | null
          plan: Database["public"]["Enums"]["lead_plan"] | null
          provincia: string | null
          raw_payload: Json | null
          razon_social: string | null
          source: Database["public"]["Enums"]["lead_source"]
          status: Database["public"]["Enums"]["lead_status"]
          telefono: string | null
          telefono_llamante: string | null
          updated_at: string
          voz: string | null
        }
        Insert: {
          cif_nif?: string | null
          ciudad?: string | null
          closed_at?: string | null
          codigo_postal?: string | null
          consentimiento?: boolean
          contacto?: string | null
          created_at?: string
          descripcion?: string | null
          direccion?: string | null
          email?: string | null
          id?: string
          llamadas_semana?: string | null
          negocio: string
          nombre: string
          oficio?: string | null
          oficio_otro?: string | null
          owner_id?: string | null
          paid?: boolean
          paid_at?: string | null
          persona_contacto?: string | null
          plan?: Database["public"]["Enums"]["lead_plan"] | null
          provincia?: string | null
          raw_payload?: Json | null
          razon_social?: string | null
          source: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          telefono?: string | null
          telefono_llamante?: string | null
          updated_at?: string
          voz?: string | null
        }
        Update: {
          cif_nif?: string | null
          ciudad?: string | null
          closed_at?: string | null
          codigo_postal?: string | null
          consentimiento?: boolean
          contacto?: string | null
          created_at?: string
          descripcion?: string | null
          direccion?: string | null
          email?: string | null
          id?: string
          llamadas_semana?: string | null
          negocio?: string
          nombre?: string
          oficio?: string | null
          oficio_otro?: string | null
          owner_id?: string | null
          paid?: boolean
          paid_at?: string | null
          persona_contacto?: string | null
          plan?: Database["public"]["Enums"]["lead_plan"] | null
          provincia?: string | null
          raw_payload?: Json | null
          razon_social?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          telefono?: string | null
          telefono_llamante?: string | null
          updated_at?: string
          voz?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          lead_id: string
          notes: string | null
          scheduled_at: string
          type: Database["public"]["Enums"]["task_type"]
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          lead_id: string
          notes?: string | null
          scheduled_at: string
          type: Database["public"]["Enums"]["task_type"]
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          lead_id?: string
          notes?: string | null
          scheduled_at?: string
          type?: Database["public"]["Enums"]["task_type"]
        }
        Relationships: [
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_active_user: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      client_status: "activo" | "baja"
      lead_plan: "aprendiz" | "oficial" | "maestro"
      lead_source: "wizard" | "a_medida" | "demo_call"
      lead_status:
        | "nuevo"
        | "contactado"
        | "demo_agendada"
        | "demo_hecha"
        | "ganado"
        | "perdido"
      task_type: "llamada" | "demo" | "cierre"
      user_role: "admin" | "comercial"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      client_status: ["activo", "baja"],
      lead_plan: ["aprendiz", "oficial", "maestro"],
      lead_source: ["wizard", "a_medida", "demo_call"],
      lead_status: [
        "nuevo",
        "contactado",
        "demo_agendada",
        "demo_hecha",
        "ganado",
        "perdido",
      ],
      task_type: ["llamada", "demo", "cierre"],
      user_role: ["admin", "comercial"],
    },
  },
} as const

export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type LeadNote = Database["public"]["Tables"]["lead_notes"]["Row"];
export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
