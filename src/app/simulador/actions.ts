'use server'

import { adminDb } from '@/lib/db'
import { getSession } from '@/lib/session'
import type { SimData } from '@/lib/bracket'

export async function saveSimulation(data: SimData) {
  const session = await getSession()
  if (!session) return { error: 'Sesión expirada. Vuelve a entrar.' }
  const db = adminDb()
  const { error } = await db.from('simulations').upsert({
    participant_id: session.id,
    data,
    updated_at: new Date().toISOString(),
  })
  if (error) return { error: 'No se pudo guardar la simulación.' }
  return { ok: true }
}
