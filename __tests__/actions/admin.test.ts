import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFrom, mockRequireAdmin } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRequireAdmin: vi.fn().mockResolvedValue({ email: 'admin@example.com' }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({ from: mockFrom })),
}))

vi.mock('@/lib/supabase/admin-guard', () => ({
  requireAdmin: mockRequireAdmin,
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { revalidatePath } from 'next/cache'
import { addAdmin, removeAdmin, updateRsvpStatus, deleteRsvp, updateWeddingInfo } from '../../app/actions/admin'

function makeChain({ error = null }: { error?: unknown } = {}) {
  const chain: Record<string, unknown> = {}
  const terminal = vi.fn().mockResolvedValue({ error })
  chain.update = vi.fn(() => chain)
  chain.insert = terminal
  chain.delete = vi.fn(() => chain)
  chain.select = vi.fn(() => chain)
  chain.eq = terminal
  chain.order = vi.fn().mockResolvedValue({ data: [], error })
  mockFrom.mockReturnValue(chain)
  return chain
}

const validWeddingInfo = {
  couple_names: 'Alice & Bob',
  sections: [],
  faqs: [],
  map_pins: [],
}

describe('addAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAdmin.mockResolvedValue({ email: 'admin@example.com' })
  })

  it('propagates auth rejection when requireAdmin throws', async () => {
    mockRequireAdmin.mockRejectedValueOnce(new Error('NEXT_REDIRECT:/admin/login'))
    await expect(addAdmin('test@example.com')).rejects.toThrow('NEXT_REDIRECT')
  })

  it('returns an error for an invalid email format', async () => {
    const result = await addAdmin('not-an-email')
    expect(result).toEqual({ success: false, error: 'Invalid email address.' })
  })

  it('returns an error for a duplicate email (unique constraint)', async () => {
    makeChain({ error: { code: '23505' } })
    const result = await addAdmin('existing@example.com')
    expect(result).toEqual({ success: false, error: 'That email is already an admin.' })
  })

  it('returns a generic error for other database failures', async () => {
    makeChain({ error: { code: 'XXXXX', message: 'unknown' } })
    const result = await addAdmin('new@example.com')
    expect(result).toEqual({ success: false, error: 'Failed to add admin.' })
  })

  it('returns success and revalidates the admins page', async () => {
    makeChain()
    const result = await addAdmin('new@example.com')
    expect(result).toEqual({ success: true })
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith('/admin/admins')
  })
})

describe('removeAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAdmin.mockResolvedValue({ email: 'admin@example.com' })
  })

  it('prevents self-removal', async () => {
    makeChain()
    const result = await removeAdmin('admin@example.com')
    expect(result).toEqual({ success: false, error: 'You cannot remove yourself.' })
  })

  it('returns an error when the database call fails', async () => {
    makeChain({ error: { message: 'DB error' } })
    const result = await removeAdmin('other@example.com')
    expect(result).toEqual({ success: false, error: 'Failed to remove admin.' })
  })

  it('returns success and revalidates the admins page', async () => {
    makeChain()
    const result = await removeAdmin('other@example.com')
    expect(result).toEqual({ success: true })
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith('/admin/admins')
  })
})

describe('updateRsvpStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAdmin.mockResolvedValue({ email: 'admin@example.com' })
  })

  it('returns an error when the database call fails', async () => {
    makeChain({ error: { message: 'DB error' } })
    const result = await updateRsvpStatus('uuid-1', 'contacted', 'note')
    expect(result).toEqual({ success: false, error: 'Failed to update.' })
  })

  it('returns success and revalidates the dashboard', async () => {
    makeChain()
    const result = await updateRsvpStatus('uuid-1', 'contacted', 'note')
    expect(result).toEqual({ success: true })
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith('/admin/dashboard')
  })
})

describe('deleteRsvp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAdmin.mockResolvedValue({ email: 'admin@example.com' })
  })

  it('returns an error when the database call fails', async () => {
    makeChain({ error: { message: 'DB error' } })
    const result = await deleteRsvp('uuid-1')
    expect(result).toEqual({ success: false, error: 'Failed to delete.' })
  })

  it('returns success and revalidates the dashboard', async () => {
    makeChain()
    const result = await deleteRsvp('uuid-1')
    expect(result).toEqual({ success: true })
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith('/admin/dashboard')
  })
})

describe('updateWeddingInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAdmin.mockResolvedValue({ email: 'admin@example.com' })
  })

  it('returns a validation error for invalid data', async () => {
    const result = await updateWeddingInfo({})
    expect(result.success).toBe(false)
    expect((result as { success: false; error: string }).error).toBeDefined()
  })

  it('returns an error when the database call fails', async () => {
    makeChain({ error: { message: 'DB error' } })
    const result = await updateWeddingInfo(validWeddingInfo)
    expect(result).toEqual({ success: false, error: 'Failed to update. Please try again.' })
  })

  it('returns success and revalidates both paths', async () => {
    makeChain()
    const result = await updateWeddingInfo(validWeddingInfo)
    expect(result).toEqual({ success: true })
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith('/')
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith('/admin/wedding-info')
  })

  it('sets venue_lat and venue_lng to null when venue_address is absent', async () => {
    const chain = makeChain()
    await updateWeddingInfo({ ...validWeddingInfo, venue_address: null })
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ venue_lat: null, venue_lng: null })
    )
  })

  it('succeeds when venue_address is set but geocoding is unavailable (no API token)', async () => {
    // NEXT_PUBLIC_MAPBOX_TOKEN is absent in the test environment, so geocodeAddress
    // returns null early without making an HTTP call — the action must still succeed.
    makeChain()
    const result = await updateWeddingInfo({ ...validWeddingInfo, venue_address: '123 Main St' })
    expect(result).toEqual({ success: true })
  })
})
