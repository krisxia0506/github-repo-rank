import { Database } from './database.types';

// Repository Types
export type Repository = Database['public']['Tables']['repositories']['Row'];
export type RepositoryInsert = Database['public']['Tables']['repositories']['Insert'];
export type RepositoryUpdate = Database['public']['Tables']['repositories']['Update'];

// Repository Stats Types
export type RepositoryStats = Database['public']['Tables']['repository_stats']['Row'];
export type RepositoryStatsInsert = Database['public']['Tables']['repository_stats']['Insert'];
export type RepositoryStatsUpdate = Database['public']['Tables']['repository_stats']['Update'];

// Invite Code Types
export type InviteCode = Database['public']['Tables']['invite_codes']['Row'];
export type InviteCodeInsert = Database['public']['Tables']['invite_codes']['Insert'];
export type InviteCodeUpdate = Database['public']['Tables']['invite_codes']['Update'];

// User Submission Types
export type UserSubmission = Database['public']['Tables']['user_submissions']['Row'];
export type UserSubmissionInsert = Database['public']['Tables']['user_submissions']['Insert'];
export type UserSubmissionUpdate = Database['public']['Tables']['user_submissions']['Update'];

// Sync Log Types
export type SyncLog = Database['public']['Tables']['sync_logs']['Row'];
export type SyncLogInsert = Database['public']['Tables']['sync_logs']['Insert'];
export type SyncLogUpdate = Database['public']['Tables']['sync_logs']['Update'];

// View Types
export type CurrentRanking = Database['public']['Views']['current_rankings']['Row'];

// Combined Types for UI
export interface RepositoryWithStats extends Repository {
  stats: RepositoryStats;
}

export interface RankingItem extends CurrentRanking {}

// Sort Options
export type SortField =
  | 'stars_count'
  | 'forks_count'
  | 'commits_count'
  | 'open_issues_count'
  | 'open_prs_count'
  | 'branches_count'
  | 'contributors_count'
  | 'code_size_kb'
  | 'commits_last_month';

// API Response Types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

export interface InviteCodeValidationResponse {
  valid: boolean;
  message?: string;
}

export interface RepositorySubmissionResponse {
  repository_id: string;
  message: string;
}

// GitHub API Types
export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
  };
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics: string[];
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  created_at: string;
  updated_at: string;
}
