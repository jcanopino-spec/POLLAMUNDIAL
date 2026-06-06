import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const COOKIE = 'polla_session'
const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET!)

export type Session = { id: string; name: string; isAdmin: boolean }

export async function createSession(s: Session) {
  const token = await new SignJWT({ ...s })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('60d')
    .sign(secret())
  const jar = await cookies()
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 60,
    path: '/',
  })
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret())
    return { id: payload.id as string, name: payload.name as string, isAdmin: !!payload.isAdmin }
  } catch {
    return null
  }
}

export async function destroySession() {
  ;(await cookies()).delete(COOKIE)
}
