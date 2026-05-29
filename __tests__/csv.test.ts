import { describe, it, expect } from 'vitest'
import { rsvpsToCsv } from '../lib/csv'

const baseRsvp = {
  id: 'abc-123',
  created_at: '2024-06-01T10:00:00.000Z',
  submitter_name: 'Alice',
  email: 'alice@example.com',
  phone: null,
  attending: true,
  party_size: 1,
  guests: [{ name: 'Alice', attending: true, dietary: '' }],
  side: 'bride',
  message: null,
  followup_status: 'new',
  admin_notes: null,
}

describe('rsvpsToCsv', () => {
  it('returns only a header row for an empty array', () => {
    const csv = rsvpsToCsv([])
    const lines = csv.split('\n')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toBe(
      'ID,Submitted At,Submitter Name,Email,Phone,Overall Attending,Party Size (Attending),Guests,Side,Message,Follow-up Status,Admin Notes'
    )
  })

  it('produces one data row per RSVP plus the header', () => {
    const csv = rsvpsToCsv([baseRsvp, baseRsvp])
    expect(csv.split('\n')).toHaveLength(3)
  })

  it('marks overall attending as Yes for an attending RSVP', () => {
    const csv = rsvpsToCsv([baseRsvp])
    expect(csv.split('\n')[1]).toContain('Yes')
  })

  it('marks overall attending as No for a non-attending RSVP', () => {
    const rsvp = { ...baseRsvp, attending: false, guests: [{ name: 'Bob', attending: false }] }
    expect(rsvpsToCsv([rsvp]).split('\n')[1]).toContain('No')
  })

  it('includes dietary info in the guests summary', () => {
    const rsvp = { ...baseRsvp, guests: [{ name: 'Alice', attending: true, dietary: 'vegan' }] }
    expect(rsvpsToCsv([rsvp])).toContain('dietary: vegan')
  })

  it('omits dietary prefix when guest has no dietary requirement', () => {
    const rsvp = { ...baseRsvp, guests: [{ name: 'Alice', attending: true, dietary: '' }] }
    expect(rsvpsToCsv([rsvp])).not.toContain('dietary:')
  })

  it('wraps values containing commas in double quotes', () => {
    const rsvp = { ...baseRsvp, submitter_name: 'Smith, John' }
    expect(rsvpsToCsv([rsvp])).toContain('"Smith, John"')
  })

  it('escapes double quotes inside values', () => {
    const rsvp = { ...baseRsvp, submitter_name: 'Say "Hello"' }
    expect(rsvpsToCsv([rsvp])).toContain('"Say ""Hello"""')
  })

  it('renders null optional fields as empty strings without throwing', () => {
    const rsvp = { ...baseRsvp, phone: null, message: null, admin_notes: null, side: null }
    expect(() => rsvpsToCsv([rsvp])).not.toThrow()
    expect(rsvpsToCsv([rsvp])).toContain('alice@example.com')
  })
})
