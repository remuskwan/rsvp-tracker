import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockRpc } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({ rpc: mockRpc })),
}))

import { submitRsvp, lookupRsvpByEmail } from '../../app/actions/rsvp'

const validRsvpData = {
  submitter_name: 'Alice',
  email: 'alice@example.com',
  guests: [
    { name: 'Alice', attending: true, dietary: '' },
    { name: 'Bob', attending: false, dietary: '' },
  ],
  side: 'bride',
  message: 'Looking forward to it!',
}

describe('submitRsvp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRpc.mockResolvedValue({ error: null })
  })

  it('returns success for valid RSVP data', async () => {
    const result = await submitRsvp(validRsvpData)
    expect(result).toEqual({ success: true })
  })

  it('calls upsert_rsvp with the correct submitter details', async () => {
    await submitRsvp(validRsvpData)
    expect(mockRpc).toHaveBeenCalledWith(
      'upsert_rsvp',
      expect.objectContaining({ p_submitter_name: 'Alice', p_email: 'alice@example.com' })
    )
  })

  it('counts only attending guests for party_size', async () => {
    await submitRsvp(validRsvpData)
    // validRsvpData has Alice attending, Bob not — party_size should be 1
    expect(mockRpc).toHaveBeenCalledWith(
      'upsert_rsvp',
      expect.objectContaining({ p_party_size: 1, p_attending: true })
    )
  })

  it('sets attending to false and party_size to 0 when no guests are attending', async () => {
    const data = {
      ...validRsvpData,
      guests: [
        { name: 'Alice', attending: false, dietary: '' },
        { name: 'Bob', attending: false, dietary: '' },
      ],
    }
    await submitRsvp(data)
    expect(mockRpc).toHaveBeenCalledWith(
      'upsert_rsvp',
      expect.objectContaining({ p_attending: false, p_party_size: 0 })
    )
  })

  it('normalises the email to lowercase before saving', async () => {
    await submitRsvp({ ...validRsvpData, email: 'ALICE@EXAMPLE.COM' })
    expect(mockRpc).toHaveBeenCalledWith(
      'upsert_rsvp',
      expect.objectContaining({ p_email: 'alice@example.com' })
    )
  })

  it('returns an error for invalid input data', async () => {
    const result = await submitRsvp({ submitter_name: '', email: 'bad-email', guests: [] })
    expect(result.success).toBe(false)
    expect((result as { success: false; error: string }).error).toBeDefined()
  })

  it('returns an error when the database call fails', async () => {
    mockRpc.mockResolvedValue({ error: { message: 'DB failure' } })
    const result = await submitRsvp(validRsvpData)
    expect(result).toEqual({ success: false, error: expect.any(String) })
  })
})

describe('lookupRsvpByEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns found: false immediately for an empty email', async () => {
    const result = await lookupRsvpByEmail('')
    expect(result).toEqual({ found: false })
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('returns found: false for a whitespace-only email', async () => {
    const result = await lookupRsvpByEmail('   ')
    expect(result).toEqual({ found: false })
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('calls get_rsvp_by_email with the normalised (lowercase + trimmed) email', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })
    await lookupRsvpByEmail('  ALICE@EXAMPLE.COM  ')
    expect(mockRpc).toHaveBeenCalledWith('get_rsvp_by_email', { p_email: 'alice@example.com' })
  })

  it('returns found: true with the RSVP when a matching row exists', async () => {
    mockRpc.mockResolvedValue({
      data: [{
        submitter_name: 'Alice',
        email: 'alice@example.com',
        phone: null,
        guests: [{ name: 'Alice', attending: true, dietary: 'vegan' }],
        side: 'bride',
        message: 'Hello',
      }],
      error: null,
    })
    const result = await lookupRsvpByEmail('alice@example.com')
    expect(result).toEqual({
      found: true,
      rsvp: expect.objectContaining({ submitter_name: 'Alice', email: 'alice@example.com' }),
    })
  })

  it('defaults guest dietary to empty string when the field is absent', async () => {
    mockRpc.mockResolvedValue({
      data: [{
        submitter_name: 'Alice',
        email: 'alice@example.com',
        phone: null,
        guests: [{ name: 'Alice', attending: true }],
        side: null,
        message: null,
      }],
      error: null,
    })
    const result = await lookupRsvpByEmail('alice@example.com')
    if (result.found) expect(result.rsvp.guests[0].dietary).toBe('')
  })

  it('returns found: false when no RSVP matches the email', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })
    expect(await lookupRsvpByEmail('unknown@example.com')).toEqual({ found: false })
  })

  it('returns found: false when the database returns an error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'DB error' } })
    expect(await lookupRsvpByEmail('alice@example.com')).toEqual({ found: false })
  })
})
