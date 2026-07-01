'use server'

import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { adminDb } from '@/lib/db'
import { getSession } from '@/lib/session'
import { recomputePoints, syncResults } from '@/lib/sync'
import { runAudit } from '@/lib/audit'

const MAX_PARTICIPANTS = 100
const PIN_GENERICO = '2026'

async function requireAdmin() {
  const session = await getSession()
  if (!session?.isAdmin) throw new Error('No autorizado')
  return session
}

// Alta de vecino: nombre + casa + apodo. Todos arrancan con el PIN genérico 2026
// y la app los obliga a cambiarlo en el primer ingreso.
export async function createParticipant(_prev: unknown, formData: FormData) {
  await requireAdmin()
  const name = String(formData.get('name') ?? '').trim()
  const house = String(formData.get('house') ?? '').trim()
  const nickname = String(formData.get('nickname') ?? '').trim()
  const isAdmin = formData.get('is_admin') === 'on'
  if (!name) return { error: 'El nombre es obligatorio.' }
  if (!house) return { error: 'El número de casa es obligatorio (es para la guerra de casas 🏠).' }

  const db = adminDb()
  const { count } = await db.from('participants').select('id', { count: 'exact', head: true })
  if ((count ?? 0) >= MAX_PARTICIPANTS) return { error: `Cupo lleno: máximo ${MAX_PARTICIPANTS} participantes.` }

  const { error } = await db.from('participants').insert({
    name,
    house_number: house,
    nickname: nickname || null,
    pin_hash: await bcrypt.hash(PIN_GENERICO, 10),
    is_admin: isAdmin,
  })
  if (error) return { error: error.code === '23505' ? 'Ya existe un participante con ese nombre.' : 'Error al crear.' }
  revalidatePath('/admin')
  return { ok: `${name}${nickname ? ` "${nickname}"` : ''} (casa ${house}) creado. PIN inicial: ${PIN_GENERICO}.` }
}

// Restablece al PIN genérico 2026 y vuelve a exigir el cambio.
export async function resetPin(participantId: string) {
  await requireAdmin()
  const db = adminDb()
  const { error } = await db
    .from('participants')
    .update({ pin_hash: await bcrypt.hash(PIN_GENERICO, 10), must_change_pin: true })
    .eq('id', participantId)
  if (error) return { error: 'Error al restablecer el PIN.' }
  revalidatePath('/admin')
  return { ok: true }
}

export async function updateParticipantInfo(participantId: string, house: string, nickname: string) {
  await requireAdmin()
  if (!house.trim()) return { error: 'El número de casa es obligatorio.' }
  const db = adminDb()
  const { error } = await db
    .from('participants')
    .update({ house_number: house.trim(), nickname: nickname.trim() || null })
    .eq('id', participantId)
  if (error) return { error: 'Error al actualizar.' }
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

// Marcador EN VIVO: el admin lo actualiza desde el estadio. Marca el partido como
// 'live' con el marcador, minuto y goleadores del momento, SIN finalizar ni repartir puntos.
export async function setLiveScore(matchId: number, home: number, away: number, minute?: string, scorers?: string) {
  await requireAdmin()
  if (!Number.isInteger(matchId) || !Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0) {
    return { error: 'Marcador inválido.' }
  }
  const db = adminDb()
  const { error } = await db
    .from('matches')
    .update({
      home_score: home, away_score: away, status: 'live', manual_result: true,
      minute: minute?.trim() || null, scorers: scorers?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', matchId)
  if (error) return { error: 'No se pudo actualizar el marcador.' }
  revalidatePath('/')
  revalidatePath('/admin')
  return { ok: `🔴 EN VIVO: ${home}–${away}${minute ? ' · ' + minute : ''}` }
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
  revalidatePath('/vivo')
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

export async function runAuditNow() {
  await requireAdmin()
  try {
    const result = await runAudit()
    await adminDb().from('settings').upsert({ key: 'last_audit', value: result })
    revalidatePath('/admin')
    return result.ok
      ? { ok: `✅ Puntajes sanos (${result.stats.preds} pronósticos, ${result.stats.tablePlayers} jugadores).` }
      : { error: `⛔ ${result.problems.length} problema(s): ${result.problems.slice(0, 3).join(' · ')}` }
  } catch {
    return { error: 'No se pudo correr la auditoría. Intenta de nuevo.' }
  }
}
