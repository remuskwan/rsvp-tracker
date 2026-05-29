import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest'

const { mockFetch } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
}))

vi.mock('next/server', () => ({
  NextResponse: {
    json(data: unknown, init?: { status?: number }) {
      return { _data: data, _status: init?.status ?? 200 }
    },
  },
}))

beforeAll(() => {
  vi.stubGlobal('fetch', mockFetch)
})

afterAll(() => {
  vi.unstubAllGlobals()
})

import { GET as getAutocomplete } from '../../app/api/places/autocomplete/route'
import { GET as getDetails } from '../../app/api/places/details/route'

type FakeResponse = { _data: unknown; _status: number }

function makeReq(url: string) {
  return { nextUrl: new URL(url) } as Parameters<typeof getAutocomplete>[0]
}

describe('GET /api/places/autocomplete', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 400 when the input param is missing', async () => {
    const req = makeReq('http://localhost/api/places/autocomplete')
    const res = (await getAutocomplete(req)) as unknown as FakeResponse
    expect(res._status).toBe(400)
    expect(res._data).toMatchObject({ error: 'input required' })
  })

  it('calls the Google Places API with the input value', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ suggestions: [] }) })
    const req = makeReq('http://localhost/api/places/autocomplete?input=coffee')
    await getAutocomplete(req)
    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('places:autocomplete')
    expect(JSON.parse(options.body as string)).toMatchObject({ input: 'coffee' })
  })

  it('includes a locationBias when lat and lng are provided', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ suggestions: [] }) })
    const req = makeReq('http://localhost/api/places/autocomplete?input=cafe&lat=1.3&lng=103.8')
    await getAutocomplete(req)
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string)
    expect(body.locationBias).toBeDefined()
    expect(body.locationBias.circle.center).toMatchObject({ latitude: 1.3, longitude: 103.8 })
  })

  it('propagates the status and error when Google Places returns a non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      text: async () => 'Service Unavailable',
    })
    const req = makeReq('http://localhost/api/places/autocomplete?input=test')
    const res = (await getAutocomplete(req)) as unknown as FakeResponse
    expect(res._status).toBe(503)
  })

  it('returns the JSON data from Google Places on success', async () => {
    const googleData = { suggestions: [{ placePrediction: { placeId: 'abc' } }] }
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => googleData })
    const req = makeReq('http://localhost/api/places/autocomplete?input=venue')
    const res = (await getAutocomplete(req)) as unknown as FakeResponse
    expect(res._status).toBe(200)
    expect(res._data).toEqual(googleData)
  })
})

describe('GET /api/places/details', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 400 when the placeId param is missing', async () => {
    const req = makeReq('http://localhost/api/places/details')
    const res = (await getDetails(req)) as unknown as FakeResponse
    expect(res._status).toBe(400)
    expect(res._data).toMatchObject({ error: 'placeId required' })
  })

  it('returns the place details on a successful fetch', async () => {
    const placeData = { location: { latitude: 1.3, longitude: 103.8 }, displayName: { text: 'Venue' } }
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => placeData })
    const req = makeReq('http://localhost/api/places/details?placeId=ChIJxxx')
    const res = (await getDetails(req)) as unknown as FakeResponse
    expect(res._status).toBe(200)
    expect(res._data).toEqual(placeData)
  })

  it('propagates the status and error when Google Places returns a non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => 'Not Found',
    })
    const req = makeReq('http://localhost/api/places/details?placeId=invalid')
    const res = (await getDetails(req)) as unknown as FakeResponse
    expect(res._status).toBe(404)
  })
})
