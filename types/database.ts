export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MemberRole = "admin" | "member";
export type PredictionStatus = "open" | "closed" | "resolved" | "cancelled";
export type LedgerReason = "initial" | "stake" | "win" | "mission_verified";
export type MissionCategory =
  | "social"
  | "observation"
  | "photo"
  | "performance"
  | "team"
  | "low_key"
  | "wildcard";
export type MissionDifficulty = "easy" | "medium" | "hard" | "chaotic_safe";
export type MissionTemplateSource = "manual" | "ai_generated";
export type MissionTemplateStatus =
  | "active"
  | "pending_review"
  | "archived"
  | "rejected";
export type MissionOutingStatus =
  | "draft"
  | "active"
  | "completed"
  | "cancelled";
export type MissionAssignmentStatus =
  | "assigned"
  | "completed"
  | "verified"
  | "rejected"
  | "skipped"
  | "rerolled";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          username: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          username?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string;
          username?: string;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      group_members: {
        Row: {
          group_id: string;
          user_id: string;
          role: MemberRole;
          joined_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      predictions: {
        Row: {
          id: string;
          group_id: string;
          created_by: string;
          title: string;
          description: string | null;
          closes_at: string;
          status: PredictionStatus;
          resolved_option_id: string | null;
          resolved_outcome: string | null;
          resolved_by: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          group_id: string;
          created_by: string;
          title: string;
          description?: string | null;
          closes_at: string;
          status?: PredictionStatus;
        };
        Update: never;
        Relationships: [];
      };
      prediction_options: {
        Row: {
          id: string;
          prediction_id: string;
          label: string;
          position: number;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      votes: {
        Row: {
          id: string;
          prediction_id: string;
          option_id: string;
          user_id: string;
          stake: number;
          created_at: string;
        };
        Insert: {
          prediction_id: string;
          option_id: string;
          user_id: string;
          stake?: number;
        };
        Update: never;
        Relationships: [];
      };
      mission_templates: {
        Row: {
          id: string;
          group_id: string;
          created_by: string | null;
          title: string;
          description: string | null;
          category: MissionCategory;
          difficulty: MissionDifficulty;
          source: MissionTemplateSource;
          status: MissionTemplateStatus;
          safety_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          created_by?: string | null;
          title: string;
          description?: string | null;
          category: MissionCategory;
          difficulty: MissionDifficulty;
          source: MissionTemplateSource;
          status: MissionTemplateStatus;
          safety_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          category?: MissionCategory;
          difficulty?: MissionDifficulty;
          status?: MissionTemplateStatus;
          safety_notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      mission_outings: {
        Row: {
          id: string;
          group_id: string;
          created_by: string | null;
          title: string;
          venue_type: string | null;
          vibe: string | null;
          starts_at: string | null;
          status: MissionOutingStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          created_by?: string | null;
          title: string;
          venue_type?: string | null;
          vibe?: string | null;
          starts_at?: string | null;
          status?: MissionOutingStatus;
          created_at?: string;
        };
        Update: {
          title?: string;
          venue_type?: string | null;
          vibe?: string | null;
          starts_at?: string | null;
          status?: MissionOutingStatus;
        };
        Relationships: [];
      };
      mission_assignments: {
        Row: {
          id: string;
          outing_id: string;
          group_id: string;
          user_id: string;
          mission_template_id: string;
          status: MissionAssignmentStatus;
          assigned_at: string;
          completed_at: string | null;
          verified_by: string | null;
          verification_note: string | null;
          rerolled_from_assignment_id: string | null;
        };
        Insert: {
          id?: string;
          outing_id: string;
          group_id: string;
          user_id: string;
          mission_template_id: string;
          status?: MissionAssignmentStatus;
          assigned_at?: string;
          completed_at?: string | null;
          verified_by?: string | null;
          verification_note?: string | null;
          rerolled_from_assignment_id?: string | null;
        };
        Update: {
          status?: MissionAssignmentStatus;
          completed_at?: string | null;
          verified_by?: string | null;
          verification_note?: string | null;
        };
        Relationships: [];
      };
      mission_preferences: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          allow_performance: boolean;
          allow_photo: boolean;
          allow_talking_to_strangers: boolean;
          allow_dancing: boolean;
          allow_drinking_related: boolean;
          max_difficulty: MissionDifficulty;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          allow_performance?: boolean;
          allow_photo?: boolean;
          allow_talking_to_strangers?: boolean;
          allow_dancing?: boolean;
          allow_drinking_related?: boolean;
          max_difficulty?: MissionDifficulty;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          allow_performance?: boolean;
          allow_photo?: boolean;
          allow_talking_to_strangers?: boolean;
          allow_dancing?: boolean;
          allow_drinking_related?: boolean;
          max_difficulty?: MissionDifficulty;
          updated_at?: string;
        };
        Relationships: [];
      };
      ledger: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          prediction_id: string | null;
          vote_id: string | null;
          mission_assignment_id: string | null;
          amount: number;
          reason: LedgerReason;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_group: {
        Args: { p_name: string };
        Returns: { group_id: string; invite_code: string }[];
      };
      join_group: {
        Args: { p_invite_code: string };
        Returns: { group_id: string; group_name: string }[];
      };
      resolve_prediction: {
        Args: { p_prediction_id: string; p_winning_option_id: string };
        Returns: undefined;
      };
      assign_missions_to_members: {
        Args: { p_group_id: string; p_outing_id: string };
        Returns: {
          assigned_count: number;
          skipped_count: number;
          warning: string | null;
        }[];
      };
      verify_mission_assignment: {
        Args: { p_assignment_id: string; p_note?: string | null };
        Returns: undefined;
      };
    };
    Enums: {
      member_role: MemberRole;
      prediction_status: PredictionStatus;
      ledger_reason: LedgerReason;
    };
    CompositeTypes: Record<string, never>;
  };
};
