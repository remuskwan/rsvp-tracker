import { z } from 'zod'

export const guestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  attending: z.boolean(),
  dietary: z.string().optional().default(''),
})

export const rsvpSchema = z.object({
  submitter_name: z.string().min(1, 'Your name is required'),
  email: z.string().email('A valid email is required').transform((s) => s.toLowerCase().trim()),
  phone: z.string().optional().default(''),
  guests: z.array(guestSchema).min(1, 'At least one guest is required'),
  side: z.enum(['bride', 'groom', 'both']).optional(),
  message: z.string().optional().default(''),
})

export type RsvpFormData = z.infer<typeof rsvpSchema>
export type GuestData = z.infer<typeof guestSchema>

export const weddingInfoSchema = z.object({
  couple_names: z.string().min(1, 'Couple names are required'),
  event_date: z.string().optional().nullable(),
  venue_name: z.string().optional().nullable(),
  venue_address: z.string().optional().nullable(),
  ceremony_time: z.string().optional().nullable(),
  reception_time: z.string().optional().nullable(),
  dress_code: z.string().optional().nullable(),
  parking_info: z.string().optional().nullable(),
  accommodations: z.string().optional().nullable(),
  sections: z.array(z.object({
    title: z.string(),
    body: z.string(),
  })).default([]),
  faqs: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).default([]),
  maps_url: z.string().url().optional().nullable(),
  map_pins: z.array(z.object({
    label: z.string().min(1),
    type: z.enum(["venue", "pickup", "mrt", "parking", "hotel", "other"]),
    lat: z.number(),
    lng: z.number(),
    description: z.string().optional().nullable(),
  })).default([]),
  rsvp_deadline: z.string().optional().nullable(),
})

export type WeddingInfoFormData = z.infer<typeof weddingInfoSchema>
