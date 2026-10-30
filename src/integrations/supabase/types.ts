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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      comentario_curtidas: {
        Row: {
          comentario_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comentario_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comentario_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comentario_curtidas_comentario_id_fkey"
            columns: ["comentario_id"]
            isOneToOne: false
            referencedRelation: "comentarios"
            referencedColumns: ["id"]
          },
        ]
      }
      comentarios: {
        Row: {
          created_at: string
          id: string
          publicacao_slug: string
          texto: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          publicacao_slug: string
          texto: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          publicacao_slug?: string
          texto?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          subject?: string | null
        }
        Relationships: []
      }
      conteudos_ocultos: {
        Row: {
          created_at: string
          id: string
          justificativa: string | null
          ocultado_por: string
          slug: string
          tipo: string
          titulo: string
        }
        Insert: {
          created_at?: string
          id?: string
          justificativa?: string | null
          ocultado_por: string
          slug: string
          tipo: string
          titulo: string
        }
        Update: {
          created_at?: string
          id?: string
          justificativa?: string | null
          ocultado_por?: string
          slug?: string
          tipo?: string
          titulo?: string
        }
        Relationships: []
      }
      interacoes: {
        Row: {
          created_at: string
          id: string
          publicacao_slug: string
          tipo: Database["public"]["Enums"]["tipo_interacao"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          publicacao_slug: string
          tipo: Database["public"]["Enums"]["tipo_interacao"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          publicacao_slug?: string
          tipo?: Database["public"]["Enums"]["tipo_interacao"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          especialidade: string | null
          id: string
          profissao: string | null
          registro_profissional: string | null
          status: string
          updated_at: string
          verificacao: string
          verificado_em: string | null
          verificado_por: string | null
          welcome_email_sent_at: string | null
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          especialidade?: string | null
          id: string
          profissao?: string | null
          registro_profissional?: string | null
          status?: string
          updated_at?: string
          verificacao?: string
          verificado_em?: string | null
          verificado_por?: string | null
          welcome_email_sent_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          especialidade?: string | null
          id?: string
          profissao?: string | null
          registro_profissional?: string | null
          status?: string
          updated_at?: string
          verificacao?: string
          verificado_em?: string | null
          verificado_por?: string | null
          welcome_email_sent_at?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      publicacoes: {
        Row: {
          autor_id: string
          capa_url: string | null
          categoria: string | null
          conteudo: string | null
          created_at: string
          id: string
          pdf_url: string | null
          resumo: string | null
          slug: string
          status: Database["public"]["Enums"]["status_publicacao"]
          tipo: Database["public"]["Enums"]["tipo_publicacao"]
          titulo: string
          updated_at: string
        }
        Insert: {
          autor_id: string
          capa_url?: string | null
          categoria?: string | null
          conteudo?: string | null
          created_at?: string
          id?: string
          pdf_url?: string | null
          resumo?: string | null
          slug: string
          status?: Database["public"]["Enums"]["status_publicacao"]
          tipo: Database["public"]["Enums"]["tipo_publicacao"]
          titulo: string
          updated_at?: string
        }
        Update: {
          autor_id?: string
          capa_url?: string | null
          categoria?: string | null
          conteudo?: string | null
          created_at?: string
          id?: string
          pdf_url?: string | null
          resumo?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["status_publicacao"]
          tipo?: Database["public"]["Enums"]["tipo_publicacao"]
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      remocoes_publicacao: {
        Row: {
          autor_id: string
          created_at: string
          id: string
          justificativa: string
          publicacao_id: string
          removido_por: string
          slug: string
          tipo: string
          titulo: string
        }
        Insert: {
          autor_id: string
          created_at?: string
          id?: string
          justificativa: string
          publicacao_id: string
          removido_por: string
          slug: string
          tipo: string
          titulo: string
        }
        Update: {
          autor_id?: string
          created_at?: string
          id?: string
          justificativa?: string
          publicacao_id?: string
          removido_por?: string
          slug?: string
          tipo?: string
          titulo?: string
        }
        Relationships: []
      }
      solicitacoes_profissional: {
        Row: {
          created_at: string
          email: string
          endereco: string
          foto_url: string | null
          id: string
          nome_completo: string
          observacao_admin: string | null
          profissao: string
          rede_social: string | null
          registro_profissional: string
          status: string
          telefone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          endereco: string
          foto_url?: string | null
          id?: string
          nome_completo: string
          observacao_admin?: string | null
          profissao: string
          rede_social?: string | null
          registro_profissional: string
          status?: string
          telefone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          endereco?: string
          foto_url?: string | null
          id?: string
          nome_completo?: string
          observacao_admin?: string | null
          profissao?: string
          rede_social?: string | null
          registro_profissional?: string
          status?: string
          telefone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_welcome_email: { Args: never; Returns: boolean }
      comment_like_summary: {
        Args: { _comment_ids: string[] }
        Returns: {
          comentario_id: string
          liked_by_me: boolean
          total: number
        }[]
      }
      decide_professional_request: {
        Args: { _observation?: string; _request_id: string; _status: string }
        Returns: {
          observation: string
          recipient_email: string
          recipient_name: string
          resulting_status: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      public_hidden_content: {
        Args: never
        Returns: {
          slug: string
          tipo: string
        }[]
      }
      public_profiles: {
        Args: { _display_name?: string; _ids?: string[] }
        Returns: {
          avatar_url: string
          bio: string
          display_name: string
          especialidade: string
          id: string
          profissao: string
          verificacao: string
        }[]
      }
      ranking_comentarios: {
        Args: { _limite?: number }
        Returns: {
          autor: string
          id: string
          publicacao_slug: string
          texto: string
          total: number
        }[]
      }
      ranking_interacoes: {
        Args: {
          _limite?: number
          _tipo: Database["public"]["Enums"]["tipo_interacao"]
        }
        Returns: {
          publicacao_slug: string
          total: number
        }[]
      }
      submit_contact_message: {
        Args: {
          _email: string
          _message: string
          _name: string
          _subject: string
        }
        Returns: string
      }
      submit_professional_request: {
        Args: {
          _email: string
          _endereco: string
          _foto_url?: string
          _nome_completo: string
          _profissao: string
          _rede_social?: string
          _registro_profissional: string
          _telefone: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "profissional" | "usuario"
      status_publicacao: "rascunho" | "publicado"
      tipo_interacao: "curtida" | "salvo" | "lido"
      tipo_publicacao: "artigo" | "post" | "revista" | "coluna"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "profissional", "usuario"],
      status_publicacao: ["rascunho", "publicado"],
      tipo_interacao: ["curtida", "salvo", "lido"],
      tipo_publicacao: ["artigo", "post", "revista", "coluna"],
    },
  },
} as const
