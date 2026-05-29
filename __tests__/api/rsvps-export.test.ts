import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFrom, mockRequireAdmin } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRequireAdmin: vi.fn().mockResolvedValue({ email: 'admin@example.com' }),
}))

vi.mock('next/server', () => {
  class FakeNextResponse {
    _body: string
    _status: number
    _headers: Record<string, string>

    constructor(body: string, init?: { status?: number; headers?: Record<string, string> }) {
      this._body = body
      this._status = init?.status ?? 200
      this._headers = init?.headers ?? {}
    }

    async text() {
      return this._body
    }

    static json(data: unknown, init?: { status?: number }) {
      const res = new FakeNextResponse(JSON.stringify(data))
      res._status = init?.status ?? 200
      return res
    }
  }

  return { NextResponse: FakeNextResponse }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({ from: mockFrom })),
}))

vi.mock('@/lib/supabase/admin-guard', () => ({
  requireAdmin: mockRequireAdmin,
}))

import { GET } from '../../app/api/rsvps/export/route'

const testRsvp = {
  id: 'uuid-1',
  created_at: '2024-01-01T00:00:00.000Z',
  submitter_name: 'Alice',
  email: 'alice@test.com',
  phone: null,
  attending: true,
  party_size: 1,
  guests: [{ name: 'Alice', attending: true }],
  side: null,
  message: null,
  followup_status: 'new',
  admin_notes: null,
}

type FakeResponse = {
  _body: string
  _status: number
  _headers: Record<string, string>
  text: () => Promise<string>
}

function makeQueryChain({ error = null, data = [testRsvp] } = {}) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data, error }),
  }
  mockFrom.mockReturnValue(chain)
  return chain
}

describe('GET /api/rsvps/export', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAdmin.mockResolvedValue({ email: 'admin@example.com' })
  })

  it('propagates the error when requireAdmin throws', async () => {
    mockRequireAdmin.mockRejectedValueOnce(new Error('NEXT_REDIRECT:/admin/login'))
    await expect(GET()).rejects.toThrow('NEXT_REDIRECT')
  })

  it('returns a 500 response when the database query fails', async () => {
    makeQueryChain({ error: { message: 'DB error' }, data: null as unknown as typeof testRsvp[] })
    const res = (await GET()) as unknown as FakeResponse
    expect(res._status).toBe(500)
  })

  it('returns a response body that starts with the CSV header row', async () => {
    makeQueryChain()
    const res = (await GET()) as unknown as FakeResponse
    const body = await res.text()
    expect(body).toContain('ID,Submitted At,Submitter Name,Email')
  })

  it('includes RSVP data rows in the response body', async () => {
    makeQueryChain()
    const res = (await GET()) as unknown as FakeResponse
    const body = await res.text()
    expect(body).toContain('alice@test.com')
    expect(body).toContain('Alice')
  })

  it('sets Content-Type to text/csv', async () => {
    makeQueryChain()
    const res = (await GET()) as unknown as FakeResponse
    expect(res._headers['Content-Type']).toContain('text/csv')
  })

  it('sets Content-Disposition as an attachment with a filename', async () => {
    makeQueryChain()
    const res = (await GET()) as unknown as FakeResponse
    expect(res._headers['Content-Disposition']).toContain('attachment; filename=')
    expect(res._headers['Content-Disposition']).toContain('.csv')
  })
})
