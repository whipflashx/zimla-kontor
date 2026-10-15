import { afterEach, describe, expect, it, vi } from 'vitest'
import { GET } from '../route'

describe('MCP protected-resource discovery', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('keeps the legacy MCP resource unchanged by default', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://kontor.zimla.io')

    const response = await GET(
      new Request('https://kontor.zimla.io/.well-known/oauth-protected-resource', {
        headers: { host: 'app.gnubok.se' },
      })
    )
    const body = await response.json()

    expect(body.resource).toBe(
      'https://kontor.zimla.io/api/extensions/ext/mcp-server/mcp'
    )
    expect(body.authorization_servers).toEqual(['https://kontor.zimla.io'])
  })

  it('advertises the exact Zimla Kontor namespace resource when requested', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://kontor.zimla.io')

    const response = await GET(
      new Request(
        'https://kontor.zimla.io/.well-known/oauth-protected-resource?tool_namespace=accounted',
        { headers: { host: 'app.accounted.se' } }
      )
    )
    const body = await response.json()

    expect(body.resource).toBe(
      'https://kontor.zimla.io/api/extensions/ext/mcp-server/mcp?tool_namespace=accounted'
    )
    expect(body.authorization_servers).toEqual(['https://kontor.zimla.io'])
  })
})
