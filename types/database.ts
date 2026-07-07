import type { PerformanceType } from "@/lib/config";

export type EventStatus = "draft" | "open" | "live" | "finished" | "expired";
export type PerformerStatus = "queued" | "performing" | "completed";

/** Shape of the `events.settings` JSON column. */
export interface EventSettings {
  songs: number;
  songDurationMinutes: number;
  songChangeMinutes: number;
  setupMinutes: Record<PerformanceType, number>;
}

export interface EventRow {
  id: string;
  name: string;
  slug: string;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  status: EventStatus;
  settings: EventSettings;
  created_at: string;
  expires_at: string;
}

export interface PerformerRow {
  id: string;
  event_id: string;
  display_name: string;
  performance_type: PerformanceType;
  songs: number;
  status: PerformerStatus;
  queue_position: number;
  setup_override: number | null;
  created_at: string;
}

export interface EventSecretRow {
  event_id: string;
  token_hash: string;
}

/**
 * Minimal generated-style Database type consumed by the typed Supabase client.
 * Kept hand-written so the project type-checks without a live project; run
 * `supabase gen types typescript` to regenerate if the schema changes.
 */
export interface Database {
  public: {
    Tables: {
      events: {
        Row: EventRow;
        Insert: Omit<EventRow, "id" | "created_at" | "status" | "expires_at"> &
          Partial<Pick<EventRow, "id" | "created_at" | "status" | "expires_at">>;
        Update: Partial<EventRow>;
        Relationships: [];
      };
      event_secrets: {
        Row: EventSecretRow;
        Insert: EventSecretRow;
        Update: Partial<EventSecretRow>;
        Relationships: [];
      };
      performers: {
        Row: PerformerRow;
        Insert: Omit<PerformerRow, "id" | "created_at"> &
          Partial<Pick<PerformerRow, "id" | "created_at">>;
        Update: Partial<PerformerRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      delete_expired_events: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
