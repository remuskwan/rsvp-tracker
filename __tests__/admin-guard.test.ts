import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.mock factories are hoisted to the top of the file, above any const/let.
// Use vi.hoisted() so these references are available inside the factories.
const { mockGetUser, mockFrom, mockRedirect } = vi.hoisted(() => {
  const mockRedirect = vi.fn((url: string) => {
    // next/navigation redirect() throws in real Next.js — simulate that
    throw new Error(`NEXT_REDIRECT:${url}`)
  })
  const mockGetUser = vi.fn()
  const mockFrom = vi.fn()
  return { mockGetUser, mockFrom, mockRedirect }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}))

vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
}))

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeSupabaseQuery(email: string | null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: email ? { email } : null,
      error: null,
    }),
  }
  mockFrom.mockReturnValue(chain)
  return chain
}

// ── Tests ────────────────────────────────────────────────────────────────────

import { requireAdmin } from '../lib/supabase/admin-guard'

describe('requireAdmin', () => {
  beforeEach(() => vi.clearAllMocks())

  it('redirects to /admin/login when there is no authenticated user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    makeSupabaseQuery(null)

    await expect(requireAdmin()).rejects.toThrow('NEXT_REDIRECT:/admin/login')
    expect(mockRedirect).toHaveBeenCalledWith('/admin/login')
  })

  it('redirects to /admin/login when user email is not in the admins table', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { email: 'notanadmin@example.com' } },
    })
    makeSupabaseQuery(null)

    await expect(requireAdmin()).rejects.toThrow('NEXT_REDIRECT:/admin/login')
    expect(mockRedirect).toHaveBeenCalledWith('/admin/login')
  })

  it('returns the user when email is in the admins table', async () => {
    const user = { email: 'remuskwan23@gmail.com' }
    mockGetUser.mockResolvedValue({ data: { user } })
    makeSupabaseQuery(user.email)

    const result = await requireAdmin()
    expect(result).toEqual(user)
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('redirects when user has no email (e.g. anonymous auth)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { email: undefined } } })
    makeSupabaseQuery(null)

    await expect(requireAdmin()).rejects.toThrow('NEXT_REDIRECT:/admin/login')
  })
})
