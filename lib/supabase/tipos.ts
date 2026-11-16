// Generado con: npm run db:tipos (Supabase · proyecto theprivatebarber). No editar a mano.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      avisos: {
        Row: {
          actualizado_en: string;
          canal: string;
          cita_id: string | null;
          creado_en: string;
          destinatario: string;
          error: string | null;
          estado: string;
          id: number;
          plantilla: string;
          proveedor_id: string | null;
          reclamacion_id: string | null;
        };
        Insert: {
          actualizado_en?: string;
          canal: string;
          cita_id?: string | null;
          creado_en?: string;
          destinatario: string;
          error?: string | null;
          estado: string;
          id?: never;
          plantilla: string;
          proveedor_id?: string | null;
          reclamacion_id?: string | null;
        };
        Update: {
          actualizado_en?: string;
          canal?: string;
          cita_id?: string | null;
          creado_en?: string;
          destinatario?: string;
          error?: string | null;
          estado?: string;
          id?: never;
          plantilla?: string;
          proveedor_id?: string | null;
          reclamacion_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "avisos_cita_id_fkey";
            columns: ["cita_id"];
            isOneToOne: false;
            referencedRelation: "citas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "avisos_reclamacion_id_fkey";
            columns: ["reclamacion_id"];
            isOneToOne: false;
            referencedRelation: "reclamaciones";
            referencedColumns: ["id"];
          },
        ];
      };
      barberos: {
        Row: {
          activo: boolean;
          anos_oficio: number | null;
          creado_en: string;
          especialidad: string | null;
          foto_url: string | null;
          id: string;
          nombre: string;
          orden: number;
          slug: string;
          user_id: string | null;
          whatsapp: string | null;
        };
        Insert: {
          activo?: boolean;
          anos_oficio?: number | null;
          creado_en?: string;
          especialidad?: string | null;
          foto_url?: string | null;
          id?: string;
          nombre: string;
          orden?: number;
          slug: string;
          user_id?: string | null;
          whatsapp?: string | null;
        };
        Update: {
          activo?: boolean;
          anos_oficio?: number | null;
          creado_en?: string;
          especialidad?: string | null;
          foto_url?: string | null;
          id?: string;
          nombre?: string;
          orden?: number;
          slug?: string;
          user_id?: string | null;
          whatsapp?: string | null;
        };
        Relationships: [];
      };
      cita_eventos: {
        Row: {
          actor: string;
          actor_id: string | null;
          cita_id: string;
          creado_en: string;
          estado_anterior: Database["public"]["Enums"]["estado_cita"] | null;
          estado_nuevo: Database["public"]["Enums"]["estado_cita"];
          id: number;
          nota: string | null;
        };
        Insert: {
          actor: string;
          actor_id?: string | null;
          cita_id: string;
          creado_en?: string;
          estado_anterior?: Database["public"]["Enums"]["estado_cita"] | null;
          estado_nuevo: Database["public"]["Enums"]["estado_cita"];
          id?: never;
          nota?: string | null;
        };
        Update: {
          actor?: string;
          actor_id?: string | null;
          cita_id?: string;
          creado_en?: string;
          estado_anterior?: Database["public"]["Enums"]["estado_cita"] | null;
          estado_nuevo?: Database["public"]["Enums"]["estado_cita"];
          id?: never;
          nota?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "cita_eventos_cita_id_fkey";
            columns: ["cita_id"];
            isOneToOne: false;
            referencedRelation: "citas";
            referencedColumns: ["id"];
          },
        ];
      };
      citas: {
        Row: {
          actualizado_en: string;
          alerta_admin_enviada_en: string | null;
          barbero_id: string;
          cliente_id: string;
          con_asesoria: boolean;
          creado_en: string;
          direccion: string | null;
          distrito_otro: string | null;
          estado: Database["public"]["Enums"]["estado_cita"];
          fecha: string;
          franja: Database["public"]["Enums"]["franja"];
          hora_confirmada: string | null;
          id: string;
          lugar: Database["public"]["Enums"]["lugar_atencion"] | null;
          motivo: string | null;
          origen: Database["public"]["Enums"]["origen_cita"];
          precio_asesoria_pen: number;
          precio_servicio_pen: number;
          precio_total_pen: number | null;
          propuesta_fecha: string | null;
          propuesta_franja: Database["public"]["Enums"]["franja"] | null;
          propuesta_hora: string | null;
          recordatorio_enviado_en: string | null;
          referencia: string | null;
          revision_zona: boolean | null;
          servicio_id: string;
          zona_id: string | null;
        };
        Insert: {
          actualizado_en?: string;
          alerta_admin_enviada_en?: string | null;
          barbero_id: string;
          cliente_id: string;
          con_asesoria?: boolean;
          creado_en?: string;
          direccion?: string | null;
          distrito_otro?: string | null;
          estado?: Database["public"]["Enums"]["estado_cita"];
          fecha: string;
          franja: Database["public"]["Enums"]["franja"];
          hora_confirmada?: string | null;
          id?: string;
          lugar?: Database["public"]["Enums"]["lugar_atencion"] | null;
          motivo?: string | null;
          origen?: Database["public"]["Enums"]["origen_cita"];
          precio_asesoria_pen?: number;
          precio_servicio_pen?: number;
          precio_total_pen?: number | null;
          propuesta_fecha?: string | null;
          propuesta_franja?: Database["public"]["Enums"]["franja"] | null;
          propuesta_hora?: string | null;
          recordatorio_enviado_en?: string | null;
          referencia?: string | null;
          revision_zona?: boolean | null;
          servicio_id: string;
          zona_id?: string | null;
        };
        Update: {
          actualizado_en?: string;
          alerta_admin_enviada_en?: string | null;
          barbero_id?: string;
          cliente_id?: string;
          con_asesoria?: boolean;
          creado_en?: string;
          direccion?: string | null;
          distrito_otro?: string | null;
          estado?: Database["public"]["Enums"]["estado_cita"];
          fecha?: string;
          franja?: Database["public"]["Enums"]["franja"];
          hora_confirmada?: string | null;
          id?: string;
          lugar?: Database["public"]["Enums"]["lugar_atencion"] | null;
          motivo?: string | null;
          origen?: Database["public"]["Enums"]["origen_cita"];
          precio_asesoria_pen?: number;
          precio_servicio_pen?: number;
          precio_total_pen?: number | null;
          propuesta_fecha?: string | null;
          propuesta_franja?: Database["public"]["Enums"]["franja"] | null;
          propuesta_hora?: string | null;
          recordatorio_enviado_en?: string | null;
          referencia?: string | null;
          revision_zona?: boolean | null;
          servicio_id?: string;
          zona_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "citas_barbero_id_fkey";
            columns: ["barbero_id"];
            isOneToOne: false;
            referencedRelation: "barberos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "citas_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "citas_servicio_id_fkey";
            columns: ["servicio_id"];
            isOneToOne: false;
            referencedRelation: "servicios";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "citas_zona_id_fkey";
            columns: ["zona_id"];
            isOneToOne: false;
            referencedRelation: "zonas";
            referencedColumns: ["id"];
          },
        ];
      };
      clientes: {
        Row: {
          actualizado_en: string;
          consentimiento_datos: boolean;
          consentimiento_en: string;
          consentimiento_marketing: boolean;
          correo: string | null;
          creado_en: string;
          id: string;
          nombre: string;
          whatsapp: string;
        };
        Insert: {
          actualizado_en?: string;
          consentimiento_datos: boolean;
          consentimiento_en?: string;
          consentimiento_marketing?: boolean;
          correo?: string | null;
          creado_en?: string;
          id?: string;
          nombre: string;
          whatsapp: string;
        };
        Update: {
          actualizado_en?: string;
          consentimiento_datos?: boolean;
          consentimiento_en?: string;
          consentimiento_marketing?: boolean;
          correo?: string | null;
          creado_en?: string;
          id?: string;
          nombre?: string;
          whatsapp?: string;
        };
        Relationships: [];
      };
      correlativos: {
        Row: {
          anio: number;
          ultimo: number;
        };
        Insert: {
          anio: number;
          ultimo?: number;
        };
        Update: {
          anio?: number;
          ultimo?: number;
        };
        Relationships: [];
      };
      horarios: {
        Row: {
          barbero_id: string;
          dia_semana: number;
          hora_fin: string;
          hora_inicio: string;
          id: string;
        };
        Insert: {
          barbero_id: string;
          dia_semana: number;
          hora_fin: string;
          hora_inicio: string;
          id?: string;
        };
        Update: {
          barbero_id?: string;
          dia_semana?: number;
          hora_fin?: string;
          hora_inicio?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "horarios_barbero_id_fkey";
            columns: ["barbero_id"];
            isOneToOne: false;
            referencedRelation: "barberos";
            referencedColumns: ["id"];
          },
        ];
      };
      perfiles: {
        Row: {
          creado_en: string;
          id: string;
          nombre: string;
          rol: Database["public"]["Enums"]["rol_panel"];
        };
        Insert: {
          creado_en?: string;
          id: string;
          nombre: string;
          rol: Database["public"]["Enums"]["rol_panel"];
        };
        Update: {
          creado_en?: string;
          id?: string;
          nombre?: string;
          rol?: Database["public"]["Enums"]["rol_panel"];
        };
        Relationships: [];
      };
      reclamaciones: {
        Row: {
          anio: number;
          apoderado: string | null;
          copia_enviada_en: string | null;
          correlativo: string | null;
          correo: string;
          creado_en: string;
          descripcion_bien: string;
          detalle: string;
          domicilio: string;
          id: string;
          menor_de_edad: boolean;
          monto_reclamado: number | null;
          nombre: string;
          numero: number;
          numero_documento: string;
          pedido: string;
          respondido_en: string | null;
          respuesta: string | null;
          telefono: string;
          tipo: Database["public"]["Enums"]["tipo_reclamacion"];
          tipo_bien: Database["public"]["Enums"]["tipo_bien"];
          tipo_documento: string;
        };
        Insert: {
          anio: number;
          apoderado?: string | null;
          copia_enviada_en?: string | null;
          correlativo?: string | null;
          correo: string;
          creado_en?: string;
          descripcion_bien: string;
          detalle: string;
          domicilio: string;
          id?: string;
          menor_de_edad?: boolean;
          monto_reclamado?: number | null;
          nombre: string;
          numero: number;
          numero_documento: string;
          pedido: string;
          respondido_en?: string | null;
          respuesta?: string | null;
          telefono: string;
          tipo: Database["public"]["Enums"]["tipo_reclamacion"];
          tipo_bien: Database["public"]["Enums"]["tipo_bien"];
          tipo_documento: string;
        };
        Update: {
          anio?: number;
          apoderado?: string | null;
          copia_enviada_en?: string | null;
          correlativo?: string | null;
          correo?: string;
          creado_en?: string;
          descripcion_bien?: string;
          detalle?: string;
          domicilio?: string;
          id?: string;
          menor_de_edad?: boolean;
          monto_reclamado?: number | null;
          nombre?: string;
          numero?: number;
          numero_documento?: string;
          pedido?: string;
          respondido_en?: string | null;
          respuesta?: string | null;
          telefono?: string;
          tipo?: Database["public"]["Enums"]["tipo_reclamacion"];
          tipo_bien?: Database["public"]["Enums"]["tipo_bien"];
          tipo_documento?: string;
        };
        Relationships: [];
      };
      servicios: {
        Row: {
          activo: boolean;
          descripcion: string;
          descripcion_corta: string;
          duracion_max: number | null;
          duracion_min: number | null;
          duracion_texto: string;
          es_adicional: boolean;
          id: string;
          nombre: string;
          orden: number;
          precio_pen: number;
          slug: string;
        };
        Insert: {
          activo?: boolean;
          descripcion?: string;
          descripcion_corta?: string;
          duracion_max?: number | null;
          duracion_min?: number | null;
          duracion_texto?: string;
          es_adicional?: boolean;
          id?: string;
          nombre: string;
          orden?: number;
          precio_pen: number;
          slug: string;
        };
        Update: {
          activo?: boolean;
          descripcion?: string;
          descripcion_corta?: string;
          duracion_max?: number | null;
          duracion_min?: number | null;
          duracion_texto?: string;
          es_adicional?: boolean;
          id?: string;
          nombre?: string;
          orden?: number;
          precio_pen?: number;
          slug?: string;
        };
        Relationships: [];
      };
      zonas: {
        Row: {
          activo: boolean;
          distrito: string;
          id: string;
          orden: number;
        };
        Insert: {
          activo?: boolean;
          distrito: string;
          id?: string;
          orden?: number;
        };
        Update: {
          activo?: boolean;
          distrito?: string;
          id?: string;
          orden?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      actor_actual: { Args: never; Returns: string };
      barbero_actual: { Args: never; Returns: string };
      barbero_atiende: {
        Args: {
          p_barbero: string;
          p_fecha: string;
          p_franja: Database["public"]["Enums"]["franja"];
        };
        Returns: boolean;
      };
      cambiar_estado_cita: {
        Args: {
          p_cita: string;
          p_estado: Database["public"]["Enums"]["estado_cita"];
          p_hora?: string;
          p_nota?: string;
          p_propuesta_fecha?: string;
          p_propuesta_franja?: Database["public"]["Enums"]["franja"];
          p_propuesta_hora?: string;
        };
        Returns: {
          actualizado_en: string;
          alerta_admin_enviada_en: string | null;
          barbero_id: string;
          cliente_id: string;
          con_asesoria: boolean;
          creado_en: string;
          direccion: string | null;
          distrito_otro: string | null;
          estado: Database["public"]["Enums"]["estado_cita"];
          fecha: string;
          franja: Database["public"]["Enums"]["franja"];
          hora_confirmada: string | null;
          id: string;
          lugar: Database["public"]["Enums"]["lugar_atencion"] | null;
          motivo: string | null;
          origen: Database["public"]["Enums"]["origen_cita"];
          precio_asesoria_pen: number;
          precio_servicio_pen: number;
          precio_total_pen: number | null;
          propuesta_fecha: string | null;
          propuesta_franja: Database["public"]["Enums"]["franja"] | null;
          propuesta_hora: string | null;
          recordatorio_enviado_en: string | null;
          referencia: string | null;
          revision_zona: boolean | null;
          servicio_id: string;
          zona_id: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "citas";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      crear_solicitud: {
        Args: {
          p_barbero: string;
          p_con_asesoria: boolean;
          p_consentimiento_datos: boolean;
          p_consentimiento_marketing: boolean;
          p_correo: string;
          p_direccion: string;
          p_distrito_otro: string;
          p_fecha: string;
          p_franja: Database["public"]["Enums"]["franja"];
          p_lugar: Database["public"]["Enums"]["lugar_atencion"];
          p_nombre: string;
          p_origen?: Database["public"]["Enums"]["origen_cita"];
          p_referencia: string;
          p_servicio: string;
          p_whatsapp: string;
          p_zona: string;
        };
        Returns: {
          actualizado_en: string;
          alerta_admin_enviada_en: string | null;
          barbero_id: string;
          cliente_id: string;
          con_asesoria: boolean;
          creado_en: string;
          direccion: string | null;
          distrito_otro: string | null;
          estado: Database["public"]["Enums"]["estado_cita"];
          fecha: string;
          franja: Database["public"]["Enums"]["franja"];
          hora_confirmada: string | null;
          id: string;
          lugar: Database["public"]["Enums"]["lugar_atencion"] | null;
          motivo: string | null;
          origen: Database["public"]["Enums"]["origen_cita"];
          precio_asesoria_pen: number;
          precio_servicio_pen: number;
          precio_total_pen: number | null;
          propuesta_fecha: string | null;
          propuesta_franja: Database["public"]["Enums"]["franja"] | null;
          propuesta_hora: string | null;
          recordatorio_enviado_en: string | null;
          referencia: string | null;
          revision_zona: boolean | null;
          servicio_id: string;
          zona_id: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "citas";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      es_admin: { Args: never; Returns: boolean };
      franja_fin: {
        Args: { f: Database["public"]["Enums"]["franja"] };
        Returns: string;
      };
      franja_inicio: {
        Args: { f: Database["public"]["Enums"]["franja"] };
        Returns: string;
      };
      hora_en_franja: {
        Args: {
          p_franja: Database["public"]["Enums"]["franja"];
          p_hora: string;
        };
        Returns: boolean;
      };
      hoy_lima: { Args: never; Returns: string };
      transicion_de_barbero: {
        Args: {
          a: Database["public"]["Enums"]["estado_cita"];
          de: Database["public"]["Enums"]["estado_cita"];
        };
        Returns: boolean;
      };
      transicion_valida: {
        Args: {
          a: Database["public"]["Enums"]["estado_cita"];
          de: Database["public"]["Enums"]["estado_cita"];
        };
        Returns: boolean;
      };
    };
    Enums: {
      estado_cita:
        "solicitud_recibida" | "pendiente" | "confirmada" | "rechazada" | "reprogramacion" | "cancelada" | "completada";
      franja: "manana" | "mediodia" | "tarde" | "noche";
      lugar_atencion: "casa" | "oficina" | "hotel";
      origen_cita: "web" | "whatsapp";
      rol_panel: "admin" | "barber";
      tipo_bien: "servicio" | "producto";
      tipo_reclamacion: "reclamo" | "queja";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      estado_cita: [
        "solicitud_recibida",
        "pendiente",
        "confirmada",
        "rechazada",
        "reprogramacion",
        "cancelada",
        "completada",
      ],
      franja: ["manana", "mediodia", "tarde", "noche"],
      lugar_atencion: ["casa", "oficina", "hotel"],
      origen_cita: ["web", "whatsapp"],
      rol_panel: ["admin", "barber"],
      tipo_bien: ["servicio", "producto"],
      tipo_reclamacion: ["reclamo", "queja"],
    },
  },
} as const;
