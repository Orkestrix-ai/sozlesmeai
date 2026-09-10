// Bu dosya Supabase MCP `generate_typescript_types` ile üretildi.
// Elle düzenlemeyin — şema değiştiğinde yeniden üretin.

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
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          detail: Json
          id: number
          resource_id: string | null
          resource_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          detail?: Json
          id?: never
          resource_id?: string | null
          resource_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          detail?: Json
          id?: never
          resource_id?: string | null
          resource_type?: string
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contract_shares: {
        Row: {
          contract_id: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          revoked_at: string | null
          token: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          revoked_at?: string | null
          token: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          revoked_at?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_shares_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_documents: {
        Row: {
          contract_id: string
          created_at: string
          created_by: string | null
          id: string
          storage_path: string
          version_id: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          storage_path: string
          version_id: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          storage_path?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            // 20260908100000: contract_documents_version_id_fkey →
            // contract_documents_version_fkey (bileşik FK — version_id
            // TEK BAŞINA değil, contract_id ile birlikte doğrulanır; bir
            // sözleşmenin, BAŞKA bir sözleşmenin sürümüne işaret eden bir
            // belge satırı açması artık DB seviyesinde imkânsız).
            foreignKeyName: "contract_documents_version_fkey"
            columns: ["version_id", "contract_id"]
            isOneToOne: true
            referencedRelation: "contract_versions"
            referencedColumns: ["id", "contract_id"]
          },
        ]
      }
      contract_findings: {
        Row: {
          code: string
          contract_id: string
          created_at: string
          detail: string
          id: number
          section_key: string | null
          severity: Database["public"]["Enums"]["finding_severity"]
          version_id: string | null
        }
        Insert: {
          code: string
          contract_id: string
          created_at?: string
          detail?: string
          id?: never
          section_key?: string | null
          severity: Database["public"]["Enums"]["finding_severity"]
          version_id?: string | null
        }
        Update: {
          code?: string
          contract_id?: string
          created_at?: string
          detail?: string
          id?: never
          section_key?: string | null
          severity?: Database["public"]["Enums"]["finding_severity"]
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_findings_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            // 20260908100000: bileşik FK, bkz. contract_documents yorumu.
            foreignKeyName: "contract_findings_version_fkey"
            columns: ["version_id", "contract_id"]
            isOneToOne: false
            referencedRelation: "contract_versions"
            referencedColumns: ["id", "contract_id"]
          },
        ]
      }
      contract_messages: {
        Row: {
          content: string
          contract_id: string
          created_at: string
          id: number
          role: Database["public"]["Enums"]["contract_message_role"]
        }
        Insert: {
          content: string
          contract_id: string
          created_at?: string
          id?: never
          role: Database["public"]["Enums"]["contract_message_role"]
        }
        Update: {
          content?: string
          contract_id?: string
          created_at?: string
          id?: never
          role?: Database["public"]["Enums"]["contract_message_role"]
        }
        Relationships: [
          {
            foreignKeyName: "contract_messages_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_types: {
        Row: {
          code: string
          name_key: string
          section_keys: string[]
        }
        Insert: {
          code: string
          name_key: string
          section_keys: string[]
        }
        Update: {
          code?: string
          name_key?: string
          section_keys?: string[]
        }
        Relationships: []
      }
      contract_versions: {
        Row: {
          contract_id: string
          created_at: string
          created_by: string | null
          id: string
          sections: Json
          source: Database["public"]["Enums"]["contract_version_source"]
          version_no: number
        }
        Insert: {
          contract_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          sections?: Json
          source: Database["public"]["Enums"]["contract_version_source"]
          version_no: number
        }
        Update: {
          contract_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          sections?: Json
          source?: Database["public"]["Enums"]["contract_version_source"]
          version_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_versions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          archived_at: string | null
          contract_type: string | null
          created_at: string
          created_by: string | null
          current_version_id: string | null
          id: string
          status: Database["public"]["Enums"]["contract_status"]
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          contract_type?: string | null
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["contract_status"]
          title?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          contract_type?: string | null
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["contract_status"]
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_contract_type_fkey"
            columns: ["contract_type"]
            isOneToOne: false
            referencedRelation: "contract_types"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "contracts_current_version_id_fkey"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "contract_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_ledger: {
        Row: {
          actor_id: string | null
          amount: number
          contract_id: string | null
          created_at: string
          entry_type: Database["public"]["Enums"]["credit_entry_type"]
          id: number
          idempotency_key: string | null
          reason: string
          workspace_id: string
        }
        Insert: {
          actor_id?: string | null
          amount: number
          contract_id?: string | null
          created_at?: string
          entry_type: Database["public"]["Enums"]["credit_entry_type"]
          id?: never
          idempotency_key?: string | null
          reason: string
          workspace_id: string
        }
        Update: {
          actor_id?: string | null
          amount?: number
          contract_id?: string | null
          created_at?: string
          entry_type?: Database["public"]["Enums"]["credit_entry_type"]
          id?: never
          idempotency_key?: string | null
          reason?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_ledger_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
        // 20260908110000: credit_ledger_actor_id_fkey ve
        // credit_ledger_contract_id_fkey KALDIRILDI (append-only defter —
        // silinen bir aktör/sözleşme kaydı yeniden yazılmasın diye artık
        // düz uuid kolonlar, FK yok).
      }
      operation_costs: {
        Row: {
          credits: number
          is_placeholder: boolean
          operation: string
        }
        Insert: {
          credits: number
          is_placeholder?: boolean
          operation: string
        }
        Update: {
          credits?: number
          is_placeholder?: boolean
          operation?: string
        }
        Relationships: []
      }
      // plan_defaults ve subscriptions 20260910120000_pay_as_you_go.sql ile
      // düşürüldü — paket/abonelik modeli terk edildi, ürün ön yüklemeli
      // krediyle çalışıyor ve ücret PDF üretiminde düşüyor.
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          locale: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string
          id: string
          locale?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          locale?: string
          updated_at?: string
        }
        Relationships: []
      }
      workspace_activity: {
        Row: {
          actor_id: string | null
          created_at: string
          id: number
          is_important: boolean
          kind: Database["public"]["Enums"]["activity_kind"]
          metadata: Json
          subject_id: string | null
          workspace_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: never
          is_important?: boolean
          kind: Database["public"]["Enums"]["activity_kind"]
          metadata?: Json
          subject_id?: string | null
          workspace_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: never
          is_important?: boolean
          kind?: Database["public"]["Enums"]["activity_kind"]
          metadata?: Json
          subject_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_activity_actor_id_profiles_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_activity_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_credits: {
        Row: {
          balance: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          balance?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          balance?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_credits_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          is_personal: boolean
          name: string
          owner_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_personal?: boolean
          name: string
          owner_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_personal?: boolean
          name?: string
          owner_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_add_credits: {
        Args: {
          p_amount: number
          p_idempotency_key?: string | null
          p_workspace_id: string
        }
        Returns: number
      }
      admin_usage_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          credits_consumed: number
          total_contracts: number
          total_messages: number
          total_users: number
          total_versions: number
          total_workspaces: number
        }[]
      }
      can_afford: {
        Args: { p_operation: string; p_workspace_id: string }
        Returns: boolean
      }
      // 20260908120000: dönüş tipi void → integer (yeni bakiye), dördüncü
      // parametre p_idempotency_key eklendi (B5 — çift harcama koruması).
      consume_credits: {
        Args: {
          p_contract_id?: string
          p_idempotency_key?: string | null
          p_operation: string
          p_workspace_id: string
        }
        Returns: number
      }
      // 20260908120000: kredi düşümü + sürüm yazımını TEK transaction'da
      // birleştiren RPC — contract_versions'ın tek yazma yolu (B6).
      create_contract_version: {
        Args: {
          p_contract_id: string
          p_idempotency_key?: string | null
          p_sections: Json
          p_source: Database["public"]["Enums"]["contract_version_source"]
        }
        Returns: { version_id: string; version_no: number; balance: number }[]
      }
      ensure_user_bootstrap: { Args: { p_user_id: string }; Returns: string }
      // 20260908130000: oturumsuz /s/[token] sayfasının service-role
      // istemcisi yerine geçen, YALNIZCA tek bir paylaşımı döndürebilen RPC.
      get_shared_contract: {
        Args: { p_token: string }
        Returns: {
          contract_id: string
          title: string
          status: Database["public"]["Enums"]["contract_status"]
          version_id: string | null
          sections: Json | null
          storage_path: string | null
        }[]
      }
      recompute_workspace_credits: {
        Args: { p_workspace_id: string }
        Returns: number
      }
      // 20260908120000: LLM/PDF işlemi krediyi düşürdükten SONRA başarısız
      // olursa telafi kaydı yazan RPC (B6 — daha önce hiç kullanılmayan
      // `refund` enum değerinin ilk gerçek yazma yolu).
      refund_credits: {
        Args: {
          p_idempotency_key: string
          p_reason?: string | null
          p_workspace_id: string
        }
        Returns: number
      }
    }
    Enums: {
      activity_kind:
        | "member_joined"
        | "contract_created"
        | "contract_status_changed"
        | "plan_changed"
        | "credits_granted"
        | "credits_consumed"
      contract_message_role: "user" | "assistant"
      contract_status: "draft" | "review" | "ready" | "shared" | "error"
      contract_version_source: "ai_draft" | "ai_edit" | "manual"
      credit_entry_type: "grant" | "consume" | "refund" | "adjustment"
      finding_severity: "info" | "warning" | "error"
      workspace_role: "admin" | "editor" | "viewer"
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
      activity_kind: [
        "member_joined",
        "contract_created",
        "contract_status_changed",
        "plan_changed",
        "credits_granted",
        "credits_consumed",
      ],
      contract_message_role: ["user", "assistant"],
      contract_status: ["draft", "review", "ready", "shared", "error"],
      contract_version_source: ["ai_draft", "ai_edit", "manual"],
      credit_entry_type: ["grant", "consume", "refund", "adjustment"],
      finding_severity: ["info", "warning", "error"],
      workspace_role: ["admin", "editor", "viewer"],
    },
  },
} as const
