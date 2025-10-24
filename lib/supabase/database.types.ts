export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      repositories: {
        Row: {
          id: string
          github_id: number
          owner: string
          name: string
          full_name: string
          description: string | null
          url: string
          homepage: string | null
          language: string | null
          topics: string[] | null
          created_at: string
          updated_at: string | null
          is_active: boolean | null
          last_synced_at: string | null
        }
        Insert: {
          id?: string
          github_id: number
          owner: string
          name: string
          full_name: string
          description?: string | null
          url: string
          homepage?: string | null
          language?: string | null
          topics?: string[] | null
          created_at: string
          updated_at?: string | null
          is_active?: boolean | null
          last_synced_at?: string | null
        }
        Update: {
          id?: string
          github_id?: number
          owner?: string
          name?: string
          full_name?: string
          description?: string | null
          url?: string
          homepage?: string | null
          language?: string | null
          topics?: string[] | null
          created_at?: string
          updated_at?: string | null
          is_active?: boolean | null
          last_synced_at?: string | null
        }
      }
      repository_stats: {
        Row: {
          id: string
          repository_id: string | null
          stars_count: number | null
          forks_count: number | null
          watchers_count: number | null
          open_issues_count: number | null
          open_prs_count: number | null
          closed_issues_count: number | null
          closed_prs_count: number | null
          commits_count: number | null
          branches_count: number | null
          releases_count: number | null
          contributors_count: number | null
          code_size_kb: number | null
          last_commit_date: string | null
          commits_last_month: number | null
          commits_last_week: number | null
          snapshot_date: string
          created_at: string | null
        }
        Insert: {
          id?: string
          repository_id?: string | null
          stars_count?: number | null
          forks_count?: number | null
          watchers_count?: number | null
          open_issues_count?: number | null
          open_prs_count?: number | null
          closed_issues_count?: number | null
          closed_prs_count?: number | null
          commits_count?: number | null
          branches_count?: number | null
          releases_count?: number | null
          contributors_count?: number | null
          code_size_kb?: number | null
          last_commit_date?: string | null
          commits_last_month?: number | null
          commits_last_week?: number | null
          snapshot_date?: string
          created_at?: string | null
        }
        Update: {
          id?: string
          repository_id?: string | null
          stars_count?: number | null
          forks_count?: number | null
          watchers_count?: number | null
          open_issues_count?: number | null
          open_prs_count?: number | null
          closed_issues_count?: number | null
          closed_prs_count?: number | null
          commits_count?: number | null
          branches_count?: number | null
          releases_count?: number | null
          contributors_count?: number | null
          code_size_kb?: number | null
          last_commit_date?: string | null
          commits_last_month?: number | null
          commits_last_week?: number | null
          snapshot_date?: string
          created_at?: string | null
        }
      }
      invite_codes: {
        Row: {
          id: string
          code: string
          description: string | null
          is_active: boolean | null
          max_uses: number | null
          current_uses: number | null
          created_at: string | null
          expires_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          code: string
          description?: string | null
          is_active?: boolean | null
          max_uses?: number | null
          current_uses?: number | null
          created_at?: string | null
          expires_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          code?: string
          description?: string | null
          is_active?: boolean | null
          max_uses?: number | null
          current_uses?: number | null
          created_at?: string | null
          expires_at?: string | null
          created_by?: string | null
        }
      }
      user_submissions: {
        Row: {
          id: string
          repository_id: string | null
          invite_code_id: string | null
          invite_code_used: string
          submitter_ip: string | null
          user_agent: string | null
          submitted_at: string | null
          status: string | null
        }
        Insert: {
          id?: string
          repository_id?: string | null
          invite_code_id?: string | null
          invite_code_used: string
          submitter_ip?: string | null
          user_agent?: string | null
          submitted_at?: string | null
          status?: string | null
        }
        Update: {
          id?: string
          repository_id?: string | null
          invite_code_id?: string | null
          invite_code_used?: string
          submitter_ip?: string | null
          user_agent?: string | null
          submitted_at?: string | null
          status?: string | null
        }
      }
      sync_logs: {
        Row: {
          id: string
          repository_id: string | null
          sync_type: string
          status: string
          error_message: string | null
          started_at: string | null
          completed_at: string | null
          duration_ms: number | null
        }
        Insert: {
          id?: string
          repository_id?: string | null
          sync_type: string
          status: string
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          duration_ms?: number | null
        }
        Update: {
          id?: string
          repository_id?: string | null
          sync_type?: string
          status?: string
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          duration_ms?: number | null
        }
      }
    }
    Views: {
      current_rankings: {
        Row: {
          id: string | null
          full_name: string | null
          owner: string | null
          name: string | null
          description: string | null
          language: string | null
          url: string | null
          stars_count: number | null
          forks_count: number | null
          commits_count: number | null
          branches_count: number | null
          open_issues_count: number | null
          open_prs_count: number | null
          contributors_count: number | null
          code_size_kb: number | null
          last_commit_date: string | null
          commits_last_month: number | null
          stars_rank: number | null
          commits_rank: number | null
          forks_rank: number | null
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
