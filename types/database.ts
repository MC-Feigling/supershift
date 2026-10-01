export interface Database {
  public: {
    Tables: {
      shift_types: {
        Row: {
          id: string
          owner_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          created_at?: string
        }
        Update: {
          name?: string
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
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          shift_type_id: string
          starts_on: string
          ends_on?: string | null
          repeats_weekly?: boolean
          created_at?: string
        }
        Update: {
          starts_on?: string
          ends_on?: string | null
          repeats_weekly?: boolean
        }
        Relationships: []
      }
      plan_shares: {
        Row: {
          id: string
          owner_id: string
          owner_email: string
          grantee_email: string
          grantee_id: string | null
          status: string
          created_at: string
          revoked_at: string | null
        }
        Insert: {
          id?: string
          owner_id: string
          owner_email?: string
          grantee_email: string
          grantee_id?: string | null
          status?: string
          created_at?: string
          revoked_at?: string | null
        }
        Update: {
          status?: string
          revoked_at?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
