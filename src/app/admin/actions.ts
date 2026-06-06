'use server'

import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { adminDb } from '@/lib/db'
import { getSession } from '@/lib/session'
import { recomputePoints, syncResults } from '@/lib/sync'

const MAX_PARTICIPANTS = 25

async function requireAdmin() {
  const session = await getSession()
  if (!session?.isAdmin) throw new Error('No autorizado')
  return session
}

export async function createParticipant(_prev: unknown, formData: FormData) {
  await requireAdmin()
  const name = String(formData.get('name') ?? '').trim()
  const pin = String(formData.get('pin') ?? '').trim()
  const isAdmin = formData.get('is_admin') === 'on'
  if (!name) return { error: 'El nombre es obligatorio.' }
  if (!/^\d{4}$/.test(pin)) return { error: 'El PIN debe ser de 4 dígitos.' }

  const db = adminDb()
  const { count } = await db.from('participants').select('id', { count: 'exact', head: true })
  if ((count ?? 0) >= MAX_PARTICIPANTS) return { error: `Cupo lleno: máximo ${MAX_PARTICIPANTS} participantes.` }

  const { error } = await db.from('participants').insert({
    name,
    pin_hash: await bcrypt.hash(pin, 10),
    is_admin: isAdmin,
  })
  if (error) return { error: error.code === '23505' ? 'Ya existe un participante con ese nombre.' : 'Error al crear.' }
  revalidatePath('/admin')
  return { ok: `${name} creado.` }
}

export async function resetPin(participantId: string, pin: string) {
  await requireAdmin()
  if (!/^\d{4}$/.test(pin)) return { error: 'El PIN debe ser de 4 dígitos.' }
  const db = adminDb()
  const { error } = await db
    .from('participants')
    .update({ pin_hash: await bcrypt.hash(pin, 10) })
    .eq('id', participantId)
  if (error) return { error: 'Error al actualizar el PIN.' }
  revalidatePath('/admin')
  return { ok: true }
}

export async function deleteParticipant(participantId: string) {
  const session = await requireAdmin()
  if (participantId === session.id) return { error: 'No puedes eliminarte a ti mismo.' }
  const db = adminDb()
  const { error } = await db.from('participants').delete().eq('id', participantId)
  if (error) return { error: 'Error al eliminar.' }
  revalidatePath('/admin')
  return { ok: true }
}

// Resultado manual (cuando el feed se demora o falla). El sync lo respeta
// hasta que el feed traiga su propio marcador.
export async function setManualResult(_prev: unknown, formData: FormData) {
  await requireAdmin()
  const matchId = Number(formData.get('match_id'))
  const home = Number(formData.get('home_score'))
  const away = Number(formData.get('away_score'))
  const winner = String(formData.get('winner') ?? '').trim()
  if (!Number.isInteger(matchId)) return { error: 'Partido inválido.' }
  if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0) {
    return { error: 'Marcador inválido.' }
  }

  const db = adminDb()
  const { data: match } = await db.from('matches').select('home_team, away_team').eq('id', matchId).single()
  if (!match) return { error: 'Partido no encontrado.' }
  // Ganador: el indicado por el admin (penales) o derivado del marcador.
  const derived = home > away ? match.home_team : away > home ? match.away_team : null
  const { error } = await db
    .from('matches')
    .update({
      home_score: home,
      away_score: away,
      winner: winner || derived,
      status: 'finished',
      manual_result: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', matchId)
  if (error) return { error: 'Error al guardar el resultado.' }

  await recomputePoints()
  revalidatePath('/')
  revalidatePath('/posiciones')
  revalidatePath('/admin')
  return { ok: `Resultado del partido ${matchId} guardado y puntos recalculados.` }
}

export async function forceSyncNow() {
  await requireAdmin()
  try {
    const r = await syncResults(true)
    revalidatePath('/')
    revalidatePath('/posiciones')
    revalidatePath('/admin')
    return { ok: `Sincronizado: ${r.finished ?? 0} partidos finalizados.` }
  } catch {
    return { error: 'El feed de resultados no respondió. Intenta de nuevo.' }
  }
}
