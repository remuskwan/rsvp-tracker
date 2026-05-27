interface GuestEntry {
  name: string
  attending: boolean
  dietary?: string
}

interface RsvpRow {
  id: string
  created_at: string
  submitter_name: string
  email: string
  phone?: string | null
  attending: boolean
  party_size: number
  guests: GuestEntry[]
  side?: string | null
  message?: string | null
  followup_status: string
  admin_notes?: string | null
}

function escapeCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function rsvpsToCsv(rsvps: RsvpRow[]): string {
  const headers = [
    'ID',
    'Submitted At',
    'Submitter Name',
    'Email',
    'Phone',
    'Overall Attending',
    'Party Size (Attending)',
    'Guests',
    'Side',
    'Message',
    'Follow-up Status',
    'Admin Notes',
  ]

  const rows = rsvps.map((r) => {
    const guestsSummary = r.guests
      .map(
        (g: GuestEntry) =>
          `${g.name} (${g.attending ? 'attending' : 'not attending'}${g.dietary ? `, dietary: ${g.dietary}` : ''})`
      )
      .join(' | ')

    return [
      r.id,
      new Date(r.created_at).toLocaleString(),
      r.submitter_name,
      r.email,
      r.phone ?? '',
      r.attending ? 'Yes' : 'No',
      r.party_size,
      guestsSummary,
      r.side ?? '',
      r.message ?? '',
      r.followup_status,
      r.admin_notes ?? '',
    ].map(escapeCell).join(',')
  })

  return [headers.join(','), ...rows].join('\n')
}
