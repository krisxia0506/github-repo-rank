// @ts-nocheck - Supabase type inference issues
import { NextRequest, NextResponse } from 'next/server'
import { updateRepositoryStats } from '@/lib/services/repository.service'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Sync a specific repository by ID
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ repositoryId: string }> }
) {
  try {
    const { repositoryId } = await context.params

    // Verify authorization
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createServiceRoleClient()

    // Check if repository exists
    const { data, error: repoError } = await supabase
      .from('repositories')
      .select('id, owner, name, full_name, is_active')
      .eq('id', repositoryId)
      .single()

    if (repoError || !data) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      )
    }

    const repository = data as { id: string; owner: string; name: string; full_name: string; is_active: boolean | null }

    if (!repository.is_active) {
      return NextResponse.json(
        { error: 'Repository is not active' },
        { status: 400 }
      )
    }

    // Log sync start
    const startTime = Date.now()

    // @ts-expect-error - Supabase type inference issue with sync_logs
    await supabase.from('sync_logs').insert({
      repository_id: repositoryId,
      sync_type: 'manual',
      status: 'in_progress',
      started_at: new Date().toISOString(),
    })

    // Update stats
    const stats = await updateRepositoryStats(repositoryId)

    // Log sync completion
    const duration = Date.now() - startTime
    // @ts-expect-error - Supabase type inference issue with sync_logs
    await supabase.from('sync_logs').insert({
      repository_id: repositoryId,
      sync_type: 'manual',
      status: 'success',
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: duration,
    })

    return NextResponse.json({
      success: true,
      repository: {
        id: repository.id,
        full_name: repository.full_name,
      },
      stats,
      duration_ms: duration,
    })
  } catch (error) {
    console.error('Error syncing repository:', error)

    const { repositoryId } = await context.params
    const supabase = createServiceRoleClient()

    // Log sync failure
    // @ts-expect-error - Supabase type inference issue with sync_logs
    await supabase.from('sync_logs').insert({
      repository_id: repositoryId,
      sync_type: 'manual',
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    })

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
