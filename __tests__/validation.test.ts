import { describe, it, expect } from 'vitest'
import { guestSchema, rsvpSchema, weddingInfoSchema, adminRsvpSchema } from '../lib/validation'

describe('guestSchema', () => {
  it('accepts a valid guest with all fields', () => {
    const result = guestSchema.safeParse({ name: 'Alice', attending: true, dietary: 'vegan' })
    expect(result.success).toBe(true)
  })

  it('defaults dietary to an empty string when omitted', () => {
    const result = guestSchema.safeParse({ name: 'Alice', attending: true })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.dietary).toBe('')
  })

  it('rejects an empty name', () => {
    const result = guestSchema.safeParse({ name: '', attending: true })
    expect(result.success).toBe(false)
  })
})

describe('rsvpSchema', () => {
  const validData = {
    submitter_name: 'Alice',
    email: 'alice@example.com',
    guests: [{ name: 'Alice', attending: true }],
    side: 'bride',
  }

  it('accepts valid RSVP data', () => {
    expect(rsvpSchema.safeParse(validData).success).toBe(true)
  })

  it('transforms email to lowercase', () => {
    const result = rsvpSchema.safeParse({ ...validData, email: 'ALICE@EXAMPLE.COM' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.email).toBe('alice@example.com')
  })

  it('rejects email with leading or trailing whitespace', () => {
    // .email() validation runs before the transform, so whitespace makes the email invalid
    const result = rsvpSchema.safeParse({ ...validData, email: '  alice@example.com  ' })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid email address', () => {
    expect(rsvpSchema.safeParse({ ...validData, email: 'not-an-email' }).success).toBe(false)
  })

  it('rejects an empty submitter_name', () => {
    expect(rsvpSchema.safeParse({ ...validData, submitter_name: '' }).success).toBe(false)
  })

  it('rejects an empty guests array', () => {
    expect(rsvpSchema.safeParse({ ...validData, guests: [] }).success).toBe(false)
  })

  it('defaults phone to an empty string', () => {
    const result = rsvpSchema.safeParse(validData)
    if (result.success) expect(result.data.phone).toBe('')
  })

  it('defaults message to an empty string', () => {
    const result = rsvpSchema.safeParse(validData)
    if (result.success) expect(result.data.message).toBe('')
  })

  it('accepts bride, groom, and both as valid side values', () => {
    for (const side of ['bride', 'groom', 'both'] as const) {
      expect(rsvpSchema.safeParse({ ...validData, side }).success).toBe(true)
    }
  })

  it('rejects an invalid side value', () => {
    expect(rsvpSchema.safeParse({ ...validData, side: 'other' }).success).toBe(false)
  })
})

describe('weddingInfoSchema', () => {
  it('accepts minimal valid data with only couple_names', () => {
    expect(weddingInfoSchema.safeParse({ couple_names: 'Alice & Bob' }).success).toBe(true)
  })

  it('rejects an empty couple_names', () => {
    expect(weddingInfoSchema.safeParse({ couple_names: '' }).success).toBe(false)
  })

  it('defaults sections, faqs, and map_pins to empty arrays', () => {
    const result = weddingInfoSchema.safeParse({ couple_names: 'Alice & Bob' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.sections).toEqual([])
      expect(result.data.faqs).toEqual([])
      expect(result.data.map_pins).toEqual([])
    }
  })

  it('rejects a map pin with an unknown type', () => {
    const pin = { label: 'Stop', type: 'bus_stop', lat: 1.3, lng: 103.8 }
    expect(
      weddingInfoSchema.safeParse({ couple_names: 'Alice & Bob', map_pins: [pin] }).success
    ).toBe(false)
  })
})

describe('adminRsvpSchema', () => {
  const base = {
    submitter_name: 'Alice',
    guests: [{ name: 'Alice', attending: true }],
  }

  it('accepts an entry with no email', () => {
    const result = adminRsvpSchema.safeParse(base)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.email).toBeUndefined()
  })

  it('treats a blank email as undefined', () => {
    const result = adminRsvpSchema.safeParse({ ...base, email: '   ' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.email).toBeUndefined()
  })

  it('lowercases and trims a provided email', () => {
    const result = adminRsvpSchema.safeParse({ ...base, email: '  ALICE@EXAMPLE.COM ' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.email).toBe('alice@example.com')
  })

  it('rejects a malformed non-empty email', () => {
    expect(adminRsvpSchema.safeParse({ ...base, email: 'not-an-email' }).success).toBe(false)
  })

  it('requires at least one guest', () => {
    expect(adminRsvpSchema.safeParse({ ...base, guests: [] }).success).toBe(false)
  })

  it('requires a submitter_name', () => {
    expect(adminRsvpSchema.safeParse({ ...base, submitter_name: '' }).success).toBe(false)
  })

  it('defaults followup_status to confirmed', () => {
    const result = adminRsvpSchema.safeParse(base)
    if (result.success) expect(result.data.followup_status).toBe('confirmed')
  })

  it('accepts an explicit followup_status', () => {
    const result = adminRsvpSchema.safeParse({ ...base, followup_status: 'new' })
    if (result.success) expect(result.data.followup_status).toBe('new')
  })

  it('rejects an unknown followup_status', () => {
    expect(adminRsvpSchema.safeParse({ ...base, followup_status: 'maybe' }).success).toBe(false)
  })
})
