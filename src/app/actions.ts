'use server'

import { revalidatePath } from 'next/cache'
import { adminDb } from '@/lib/db'
import { getSession } from '@/lib/session'

// Guarda/actualiza un pronóstico. Bloqueo server-side: rechaza si el partido ya inició.
export async function savePrediction(matchId: number, home: number, away: number) {
  const session = await getSession()
  if (!session) return { error: 'Sesión expirada. Vuelve a entrar.' }
  if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0 || home > 99 || away > 99) {
    return { error: 'Marcador inválido.' }
  }

  const db = adminDb()
  const { data: match } = await db.from('matches').select('kickoff_utc').eq('id', matchId).single()
  if (!match) return { error: 'Partido no encontrado.' }
  if (new Date(match.kickoff_utc).getTime() <= Date.now()) {
    return { error: '⛔ El partido ya inició: pronóstico bloqueado.' }
  }

  const { error } = await db.from('predictions').upsert({
    participant_id: session.id,
    match_id: matchId,
    home_score: home,
    away_score: away,
    updated_at: new Date().toISOString(),
  })
  if (error) return { error: 'No se pudo guardar. Intenta de nuevo.' }
  revalidatePath('/')
  return { ok: true }
}

// Elige campeón. Se bloquea cuando inicia el partido inaugural (partido 1).
export async function saveChampion(team: string) {
  const session = await getSession()
  if (!session) return { error: 'Sesión expirada. Vuelve a entrar.' }

  const db = adminDb()
  const { data: opener } = await db.from('matches').select('kickoff_utc').eq('id', 1).single()
  if (opener && new Date(opener.kickoff_utc).getTime() <= Date.now()) {
    return { error: '⛔ El Mundial ya comenzó: la elección de campeón está cerrada.' }
  }

  const { error } = await db.from('participants').update({ champion_team: team }).eq('id', session.id)
  if (error) return { error: 'No se pudo guardar.' }
  revalidatePath('/campeon')
  return { ok: true }
}
