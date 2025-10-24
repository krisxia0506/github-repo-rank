// @ts-nocheck - Supabase type inference issues
import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { updateRepositoryStats } from '@/lib/services/repository.service'

// This API is protected and should only be called by cron jobs or authorized services
export async function POST(request: NextRequest) {
  try {
    // Verify authorization (simple bearer token check)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createServiceRoleClient()

    // Get all active repositories
    const { data, error } = await supabase
      .from('repositories')
      .select('id, owner, name, full_name')
      .eq('is_active', true)

    if (error) {
      throw error
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No repositories to sync',
        synced: 0,
      })
    }

    const repositories = data as Array<{ id: string; owner: string; name: string; full_name: string }>

    // Sync repositories in batches to avoid rate limits
    const results = {
      total: repositories.length,
      success: 0,
      failed: 0,
      errors: [] as Array<{ repo: string; error: string }>,
    }

    for (const repo of repositories) {
      try {
        // Log sync start
        const startTime = Date.now()

        // @ts-expect-error - Supabase type inference issue with sync_logs
        await supabase.from('sync_logs').insert({
          repository_id: repo.id,
          sync_type: 'scheduled',
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })

        // Update stats
        await updateRepositoryStats(repo.id)

        // Log sync completion
        const duration = Date.now() - startTime
        // @ts-expect-error - Supabase type inference issue with sync_logs
        await supabase.from('sync_logs').insert({
          repository_id: repo.id,
          sync_type: 'scheduled',
          status: 'success',
          started_at: new Date(startTime).toISOString(),
          completed_at: new Date().toISOString(),
          duration_ms: duration,
        })

        results.success++
      } catch (error) {
        results.failed++
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        results.errors.push({
          repo: repo.full_name,
          error: errorMessage,
        })

        // Log sync failure
        // @ts-expect-error - Supabase type inference issue with sync_logs
        await supabase.from('sync_logs').insert({
          repository_id: repo.id,
          sync_type: 'scheduled',
          status: 'failed',
          error_message: errorMessage,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        })
      }

      // Add a small delay to avoid hitting rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error('Error syncing repositories:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check sync status
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createServiceRoleClient()

    // Get recent sync logs
    const { data: logs, error } = await supabase
      .from('sync_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(50)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      logs,
    })
  } catch (error) {
    console.error('Error fetching sync logs:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
