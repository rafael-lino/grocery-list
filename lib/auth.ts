export const COOKIE_NAME = 'gl_session'
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 60 // 60 days

async function getKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

export async function sign(payload: string, secret: string): Promise<string> {
  const key = await getKey(secret)
  const enc = new TextEncoder()
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload))
  const b64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return `${payload}.${b64}`
}

export async function verify(token: string, secret: string): Promise<boolean> {
  const lastDot = token.lastIndexOf('.')
  if (lastDot === -1) return false
  const payload = token.slice(0, lastDot)
  const expected = await sign(payload, secret)
  return expected === token
}
