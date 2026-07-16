'use server'

import { revalidatePath } from 'next/cache'
import { adminDb } from '@/lib/db'
import { getSession } from '@/lib/session'
import { rosterFor } from '@/lib/rosters'
import { GOAL_PHASES, NECO_EXCLUDED_HOUSE, NECO_MATCH_IDS, type GoalPhase } from '@/lib/neco'

export type NecoInput = {
  matchId: number
  homeScore: number
  awayScore: number
  scorers: string[]
  goalPhases: string[]
  cornersTotal: number | null
  penalties: boolean
}

// Guarda/actualiza el pronóstico NECO de la CASA del jugador logueado.
// Bloqueo por casa: la '2026' (invitados) ve pero no participa. Cierra al pitazo.
export async function saveNecoPrediction(input: NecoInput) {
  const session = await getSession()
  if (!session) return { error: 'Sesión expirada. Vuelve a entrar.' }
  if (!NECO_MATCH_IDS.includes(input.matchId as (typeof NECO_MATCH_IDS)[number])) {
    return { error: 'Este partido no hace parte del NECO.' }
  }

  const db = adminDb()
  const { data: me } = await db.from('participants').select('house_number').eq('id', session.id).single()
  const house = me?.house_number?.trim()
  if (!house) return { error: 'No tienes casa asignada. Habla con el admin.' }
  if (house === NECO_EXCLUDED_HOUSE) {
    return { error: '🏠 La Casa 2026 (invitados) puede ver el NECO pero no participa 😉' }
  }

  const { data: match } = await db
    .from('matches')
    .select('kickoff_utc, home_team, away_team')
    .eq('id', input.matchId)
    .single()
  if (!match) return { error: 'Partido no encontrado.' }
  if (new Date(match.kickoff_utc).getTime() <= Date.now()) {
    return { error: '⛔ Ya pitó el árbitro: el NECO de este partido está cerrado.' }
  }

  // Marcador
  const home = input.homeScore, away = input.awayScore
  if (![home, away].every((n) => Number.isInteger(n) && n >= 0 && n <= 20)) {
    return { error: 'Marcador inválido.' }
  }
  const totalGoals = home + away

  // Goleadores: OBLIGATORIO uno por cada gol del marcador, por equipo (nada en blanco).
  const homeRoster = new Set(rosterFor(match.home_team))
  const awayRoster = new Set(rosterFor(match.away_team))
  const homeGoals = (input.scorers ?? []).filter((s) => homeRoster.has(s))
  const awayGoals = (input.scorers ?? []).filter((s) => awayRoster.has(s))
  if (totalGoals > 0 && (homeGoals.length !== home || awayGoals.length !== away)) {
    return { error: '⚠️ Falta el autor de algún gol: pon un goleador por cada gol del marcador.' }
  }
  const cleanScorers = [...homeGoals, ...awayGoals]

  // Etapas: OBLIGATORIO asignar la etapa (tiempo) de cada gol.
  const GP = new Set<GoalPhase>(GOAL_PHASES)
  const phases = (input.goalPhases ?? []).filter((p): p is GoalPhase => GP.has(p as GoalPhase))
  if (totalGoals > 0 && phases.length !== totalGoals) {
    return { error: '⚠️ Falta la etapa de algún gol: asigna el tiempo (1er/2do/alargue) de cada gol.' }
  }

  const corners =
    input.cornersTotal == null || Number.isNaN(input.cornersTotal)
      ? null
      : Math.max(0, Math.min(50, Math.trunc(input.cornersTotal)))

  const { error } = await db.from('neco_predictions').upsert({
    house_number: house,
    match_id: input.matchId,
    home_score: home,
    away_score: away,
    scorers: cleanScorers,
    goal_phases: phases,
    corners_total: corners,
    penalties: !!input.penalties,
    updated_by: session.id,
    updated_at: new Date().toISOString(),
  })
  if (error) return { error: 'No se pudo guardar. Intenta de nuevo.' }

  revalidatePath('/neco')
  return { ok: true, house }
}
