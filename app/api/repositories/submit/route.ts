import { NextRequest, NextResponse } from 'next/server'
import { parseGitHubUrl, validateRepository } from '@/lib/github/repository'
import { validateInviteCode, incrementInviteCodeUsage, createUserSubmission } from '@/lib/services/invite-code.service'
import { createRepository } from '@/lib/services/repository.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { repoUrl, inviteCode } = body

    // Validate input
    if (!repoUrl || !inviteCode) {
      return NextResponse.json(
        { error: 'Repository URL and invite code are required' },
        { status: 400 }
      )
    }

    // Parse GitHub URL
    const parsed = parseGitHubUrl(repoUrl)
    if (!parsed) {
      return NextResponse.json(
        { error: 'Invalid GitHub repository URL. Please use format: https://github.com/owner/repo or owner/repo' },
        { status: 400 }
      )
    }

    const { owner, repo } = parsed

    // Validate invite code
    const inviteValidation = await validateInviteCode(inviteCode)
    if (!inviteValidation.valid) {
      return NextResponse.json(
        { error: inviteValidation.reason || 'Invalid invite code' },
        { status: 403 }
      )
    }

    // Validate repository exists on GitHub
    const repoExists = await validateRepository(owner, repo)
    if (!repoExists) {
      return NextResponse.json(
        { error: 'Repository not found on GitHub. Please check the URL and try again.' },
        { status: 404 }
      )
    }

    // Create repository and fetch stats
    const result = await createRepository(owner, repo)

    if (!result.isNew) {
      return NextResponse.json(
        {
          error: 'Repository already exists in the database',
          repository: {
            id: result.repository.id,
            full_name: result.repository.full_name,
          }
        },
        { status: 409 }
      )
    }

    const repository = result.repository

    // Increment invite code usage
    await incrementInviteCodeUsage(inviteValidation.inviteCode!.id)

    // Create user submission record
    const userAgent = request.headers.get('user-agent') || undefined
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : undefined

    await createUserSubmission(
      repository.id,
      inviteValidation.inviteCode!.id,
      inviteCode,
      {
        submitter_ip: ip,
        user_agent: userAgent,
      }
    )

    return NextResponse.json(
      {
        success: true,
        repository: {
          id: repository.id,
          full_name: repository.full_name,
          owner: repository.owner,
          name: repository.name,
          url: repository.url,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error submitting repository:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
