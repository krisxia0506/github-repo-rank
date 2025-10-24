export interface Database {
  public: {
    Tables: {
      repositories: {
        Row: {
          id: string;
          github_id: number;
          owner: string;
          name: string;
          full_name: string;
          description: string | null;
          url: string;
          homepage: string | null;
          language: string | null;
          topics: string[];
          created_at: string;
          updated_at: string;
          is_active: boolean;
          last_synced_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['repositories']['Row'], 'id' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['repositories']['Insert']>;
      };
      repository_stats: {
        Row: {
          id: string;
          repository_id: string;
          stars_count: number;
          forks_count: number;
          watchers_count: number;
          open_issues_count: number;
          open_prs_count: number;
          closed_issues_count: number;
          closed_prs_count: number;
          commits_count: number;
          branches_count: number;
          releases_count: number;
          contributors_count: number;
          code_size_kb: number;
          last_commit_date: string | null;
          commits_last_month: number;
          commits_last_week: number;
          snapshot_date: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['repository_stats']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['repository_stats']['Insert']>;
      };
      invite_codes: {
        Row: {
          id: string;
          code: string;
          description: string | null;
          is_active: boolean;
          max_uses: number | null;
          current_uses: number;
          created_at: string;
          expires_at: string | null;
          created_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['invite_codes']['Row'], 'id' | 'created_at' | 'current_uses'>;
        Update: Partial<Database['public']['Tables']['invite_codes']['Insert']>;
      };
      user_submissions: {
        Row: {
          id: string;
          repository_id: string;
          invite_code_id: string | null;
          invite_code_used: string;
          submitter_ip: string | null;
          user_agent: string | null;
          submitted_at: string;
          status: 'pending' | 'validated' | 'failed';
        };
        Insert: Omit<Database['public']['Tables']['user_submissions']['Row'], 'id' | 'submitted_at'>;
        Update: Partial<Database['public']['Tables']['user_submissions']['Insert']>;
      };
      sync_logs: {
        Row: {
          id: string;
          repository_id: string;
          sync_type: 'full_sync' | 'incremental_sync';
          status: 'success' | 'failed' | 'in_progress';
          error_message: string | null;
          started_at: string;
          completed_at: string | null;
          duration_ms: number | null;
        };
        Insert: Omit<Database['public']['Tables']['sync_logs']['Row'], 'id' | 'started_at'>;
        Update: Partial<Database['public']['Tables']['sync_logs']['Insert']>;
      };
    };
    Views: {
      current_rankings: {
        Row: {
          id: string;
          full_name: string;
          owner: string;
          name: string;
          description: string | null;
          language: string | null;
          url: string;
          stars_count: number;
          forks_count: number;
          commits_count: number;
          branches_count: number;
          open_issues_count: number;
          open_prs_count: number;
          contributors_count: number;
          code_size_kb: number;
          last_commit_date: string | null;
          commits_last_month: number;
          stars_rank: number;
          commits_rank: number;
          forks_rank: number;
        };
      };
    };
  };
}
