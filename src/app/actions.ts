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
    return { error: '⛔ Ya pitó el árbitro: pronóstico cerrado. Ni llorando ni con tutela 😅' }
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

// Cambio de PIN obligatorio en el primer ingreso (el inicial es el número de la casa).
export async function changePin(pin: string, confirm: string) {
  const session = await getSession()
  if (!session) return { error: 'Sesión expirada. Vuelve a entrar.' }
  if (!/^\d{4}$/.test(pin)) return { error: 'El PIN debe ser de 4 dígitos.' }
  if (pin !== confirm) return { error: 'Los dos PIN no coinciden. Concéntrate 😅' }

  const { default: bcrypt } = await import('bcryptjs')
  const db = adminDb()
  const { error } = await db
    .from('participants')
    .update({ pin_hash: await bcrypt.hash(pin, 10), must_change_pin: false })
    .eq('id', session.id)
  if (error) return { error: 'No se pudo guardar.' }
  return { ok: true }
}

// Elige los 2 finalistas y el campeón (que debe ser uno de los dos).
// Se bloquea cuando inicia el partido inaugural (partido 1).
export async function savePicks(finalist1: string, finalist2: string, champion: string) {
  const session = await getSession()
  if (!session) return { error: 'Sesión expirada. Vuelve a entrar.' }
  if (!finalist1 || !finalist2 || finalist1 === finalist2) {
    return { error: 'Elige dos finalistas distintos.' }
  }
  if (champion !== finalist1 && champion !== finalist2) {
    return { error: 'El campeón tiene que ser uno de tus dos finalistas (lógica pura 🧠).' }
  }

  const db = adminDb()
  const { data: opener } = await db.from('matches').select('kickoff_utc').eq('id', 1).single()
  if (opener && new Date(opener.kickoff_utc).getTime() <= Date.now()) {
    return { error: '⛔ El Mundial ya comenzó: las apuestas grandes están cerradas.' }
  }

  const { error } = await db
    .from('participants')
    .update({ finalist1, finalist2, champion_team: champion })
    .eq('id', session.id)
  if (error) return { error: 'No se pudo guardar.' }
  revalidatePath('/campeon')
  revalidatePath('/bienvenida')
  return { ok: true }
}
