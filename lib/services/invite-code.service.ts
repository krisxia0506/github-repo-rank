// @ts-nocheck - Supabase type inference issues
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'

type InviteCode = Database['public']['Tables']['invite_codes']['Row']

// Helper to work around TypeScript/Supabase type inference issues
function assertInviteCode(data: any): InviteCode {
  return data as InviteCode
}

/**
 * Validate an invite code
 */
export async function validateInviteCode(code: string): Promise<{
  valid: boolean
  inviteCode?: InviteCode
  reason?: string
}> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('invite_codes')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return { valid: false, reason: 'Invite code not found' }
  }

  const inviteCode = assertInviteCode(data)

  // Check if expired
  if (inviteCode.expires_at) {
    const expiryDate = new Date(inviteCode.expires_at)
    if (expiryDate < new Date()) {
      return { valid: false, reason: 'Invite code has expired' }
    }
  }

  // Check if max uses reached
  if (inviteCode.max_uses !== null && inviteCode.current_uses! >= inviteCode.max_uses) {
    return { valid: false, reason: 'Invite code has reached maximum uses' }
  }

  return { valid: true, inviteCode }
}

/**
 * Increment invite code usage count
 */
export async function incrementInviteCodeUsage(inviteCodeId: string) {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('invite_codes')
    .select('current_uses')
    .eq('id', inviteCodeId)
    .single()

  if (error) throw error

  const currentUses = (data as any).current_uses || 0
  const newCount = currentUses + 1

  const { error: updateError } = await supabase
    .from('invite_codes')
    .update({ current_uses: newCount } as any)
    .eq('id', inviteCodeId)

  if (updateError) throw updateError
}

/**
 * Create a user submission record
 */
export async function createUserSubmission(
  repositoryId: string,
  inviteCodeId: string,
  inviteCodeUsed: string,
  metadata?: {
    submitter_ip?: string
    user_agent?: string
  }
) {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('user_submissions')
    .insert({
      repository_id: repositoryId,
      invite_code_id: inviteCodeId,
      invite_code_used: inviteCodeUsed,
      submitter_ip: metadata?.submitter_ip,
      user_agent: metadata?.user_agent,
      status: 'approved',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get user submission history
 */
export async function getUserSubmissions(limit: number = 50) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('user_submissions')
    .select(`
      *,
      repositories (
        full_name,
        name,
        owner,
        url
      ),
      invite_codes (
        code,
        description
      )
    `)
    .order('submitted_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

/**
 * Create a new invite code (admin only)
 */
export async function createInviteCode(
  code: string,
  options?: {
    description?: string
    max_uses?: number
    expires_at?: string
    created_by?: string
  }
) {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('invite_codes')
    .insert({
      code,
      description: options?.description,
      max_uses: options?.max_uses,
      expires_at: options?.expires_at,
      created_by: options?.created_by,
      is_active: true,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get all active invite codes (admin only)
 */
export async function getAllInviteCodes() {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('invite_codes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
