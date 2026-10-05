export interface Database {
  public: {
    Tables: {
      shift_types: {
        Row: {
          id: string
          owner_id: string
          name: string
          color_index: number
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          color_index: number
          created_at?: string
        }
        Update: {
          name?: string
          color_index?: number
        }
        Relationships: []
      }
      placements: {
        Row: {
          id: string
          owner_id: string
          shift_type_id: string
          starts_on: string
          ends_on: string | null
          repeats_weekly: boolean
          note: string
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          shift_type_id: string
          starts_on: string
          ends_on?: string | null
          repeats_weekly?: boolean
          note?: string
          created_at?: string
        }
        Update: {
          starts_on?: string
          ends_on?: string | null
          repeats_weekly?: boolean
          note?: string
        }
        Relationships: []
      }
      plan_shares: {
        Row: {
          id: string
          owner_id: string
          owner_email: string
          grantee_email: string | null
          grantee_id: string | null
          status: string
          can_write: boolean
          invite_channel: string
          invite_token: string | null
          created_at: string
          revoked_at: string | null
        }
        Insert: {
          id?: string
          owner_id: string
          owner_email?: string
          grantee_email?: string | null
          grantee_id?: string | null
          status?: string
          can_write?: boolean
          invite_channel?: string
          invite_token?: string | null
          created_at?: string
          revoked_at?: string | null
        }
        Update: {
          status?: string
          revoked_at?: string | null
          grantee_id?: string | null
          grantee_email?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at?: string
        }
        Update: {
          endpoint?: string
          p256dh?: string
          auth?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      lookup_plan_invite: {
        Args: { share_token: string }
        Returns: {
          owner_email: string
          status: string
          is_own: boolean
          grantee_is_self: boolean
          can_write: boolean
        } | null
      }
      claim_plan_share: {
        Args: { share_token: string }
        Returns: {
          owner_id: string
          owner_email: string
        } | null
      }
    }
  }
}
