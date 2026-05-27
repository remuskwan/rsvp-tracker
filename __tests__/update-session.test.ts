import { describe, it, expect, vi, beforeEach } from 'vitest'

// Hoist all mocks so they are available inside vi.mock() factories
const { mockGetUser, mockGetAll, mockSetAll, mockNextResponseNext } = vi.hoisted(() => {
  const mockGetUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null })
  const mockGetAll = vi.fn().mockReturnValue([])
  const mockSetAll = vi.fn()

  const mockResponseInstance = {
    cookies: { set: mockSetAll },
  }
  const mockNextResponseNext = vi.fn().mockReturnValue(mockResponseInstance)

  return { mockGetUser, mockGetAll, mockSetAll, mockNextResponseNext }
})

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}))

vi.mock('next/server', () => {
  class FakeNextRequest {
    url: string
    cookies = {
      getAll: mockGetAll,
      set: vi.fn(),
    }
    constructor(url: string) {
      this.url = url
    }
  }

  class FakeNextResponse {
    cookies = { set: mockSetAll }
    static next = mockNextResponseNext
  }

  return { NextRequest: FakeNextRequest, NextResponse: FakeNextResponse }
})

// ── Tests ────────────────────────────────────────────────────────────────────

import { updateSession } from '../lib/supabase/update-session'
import { NextRequest } from 'next/server'

describe('updateSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAll.mockReturnValue([])
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    mockNextResponseNext.mockReturnValue({ cookies: { set: mockSetAll } })
  })

  it('returns a response', async () => {
    const req = new NextRequest('http://localhost/admin/dashboard')
    const response = await updateSession(req)
    expect(response).toBeDefined()
  })

  it('calls supabase.auth.getUser() to trigger token refresh', async () => {
    const req = new NextRequest('http://localhost/admin/dashboard')
    await updateSession(req)
    expect(mockGetUser).toHaveBeenCalledOnce()
  })

  it('reads cookies from the incoming request via createServerClient', async () => {
    const { createServerClient } = await import('@supabase/ssr')
    const req = new NextRequest('http://localhost/admin/dashboard')
    await updateSession(req)
    // The getAll fn passed to createServerClient should delegate to request.cookies.getAll
    const capturedCookies = vi.mocked(createServerClient).mock.calls[0][2].cookies
    capturedCookies.getAll()
    expect(mockGetAll).toHaveBeenCalled()
  })

  it('works when the request has no cookies', async () => {
    mockGetAll.mockReturnValue([])
    const req = new NextRequest('http://localhost/')
    await expect(updateSession(req)).resolves.not.toThrow()
  })
})
