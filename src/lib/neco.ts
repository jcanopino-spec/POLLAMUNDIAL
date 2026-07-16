// Motor de puntos del evento NECO (por casa, aparte de la app general).
// Reglas: ganador 10 · nº goles del ganador 5 · cada goleador 5 ·
// córners totales 5 · etapa del gol 5 · penaltis 3.
import type { Match } from './db'

export const NECO_MATCH_IDS = [103, 104] as const // 🥉 tercer puesto y 🏆 final
export const NECO_EXCLUDED_HOUSE = '2026'          // casa simbólica de invitados (no participa)

export type NecoScoring = {
  winner: number
  winner_goals: number
  scorer: number
  corners: number
  goal_phase: number
  penalties: number
}

export const DEFAULT_NECO_SCORING: NecoScoring = {
  winner: 10, winner_goals: 5, scorer: 5, corners: 5, goal_phase: 5, penalties: 3,
}

export type GoalPhase = '1T' | '2T' | 'ET1' | 'ET2'
export const GOAL_PHASES: GoalPhase[] = ['1T', '2T', 'ET1', 'ET2']
export const PHASE_LABEL: Record<GoalPhase, string> = {
  '1T': 'Primer tiempo',
  '2T': 'Segundo tiempo',
  'ET1': 'Alargue · 1er tiempo',
  'ET2': 'Alargue · 2do tiempo',
}

export type NecoPrediction = {
  house_number: string
  match_id: number
  winner: string | null
  winner_goals: number | null
  scorers: string[]
  corners_total: number | null
  goal_phase: GoalPhase | null
  penalties: boolean
}

function normName(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

// Minuto → etapa. El descuento cuenta para la etapa en curso (45+X = 1T, 90+X = 2T).
export function phaseFromMinute(min: string | number | null | undefined): GoalPhase | null {
  if (min == null) return null
  const n = typeof min === 'number' ? min : parseInt(String(min), 10)
  if (!Number.isFinite(n)) return null
  if (n <= 45) return '1T'
  if (n <= 90) return '2T'
  if (n <= 105) return 'ET1'
  return 'ET2'
}

// Etapa real del PRIMER gol del partido (regla base; fácil de ajustar a "etapa con más goles").
export function actualGoalPhase(m: Pick<Match, 'goals'>): GoalPhase | null {
  const mins = (m.goals ?? [])
    .map((g) => parseInt(String(g?.min ?? ''), 10))
    .filter((n) => Number.isFinite(n))
  if (!mins.length) return null
  return phaseFromMinute(Math.min(...mins))
}

// ¿Hubo tanda de penaltis? Empate tras prórroga con ganador definido.
export function hadPenalties(
  m: Pick<Match, 'home_score' | 'away_score' | 'winner' | 'status'>
): boolean {
  return (
    m.status === 'finished' &&
    m.home_score != null && m.away_score != null &&
    m.home_score === m.away_score && !!m.winner
  )
}

export type NecoBreakdown = {
  winner: number
  winner_goals: number
  scorer: number
  corners: number
  goal_phase: number
  penalties: number
  total: number
}

export const emptyBreakdown = (): NecoBreakdown => ({
  winner: 0, winner_goals: 0, scorer: 0, corners: 0, goal_phase: 0, penalties: 0, total: 0,
})

// Califica una predicción de casa contra el resultado real de un partido.
// `actualCorners` viene de settings 'neco_actual' (lo carga el admin); si es null,
// el ítem de córners no puntúa todavía.
export function scoreNeco(
  pred: NecoPrediction,
  m: Match,
  s: NecoScoring,
  actualCorners?: number | null
): NecoBreakdown {
  const b = emptyBreakdown()
  if (m.status !== 'finished' || m.home_score == null || m.away_score == null) return b

  const realWinnerGoals = Math.max(m.home_score, m.away_score)

  // 🏆 Ganador
  if (pred.winner && m.winner && pred.winner === m.winner) b.winner = s.winner
  // 🔢 Nº de goles del equipo ganador
  if (pred.winner_goals != null && pred.winner_goals === realWinnerGoals) b.winner_goals = s.winner_goals
  // ⚽ Goleadores (multiplicidad, tope = goles reales de cada jugador)
  const real = new Map<string, number>()
  for (const g of m.goals ?? []) { const k = normName(g.name); if (k) real.set(k, (real.get(k) ?? 0) + 1) }
  const got = new Map<string, number>()
  for (const n of pred.scorers ?? []) { const k = normName(n); if (k) got.set(k, (got.get(k) ?? 0) + 1) }
  let hits = 0
  for (const [k, c] of got) hits += Math.min(c, real.get(k) ?? 0)
  b.scorer = hits * s.scorer
  // 🚩 Córners totales
  if (actualCorners != null && pred.corners_total != null && pred.corners_total === actualCorners) b.corners = s.corners
  // ⏱️ Etapa de los goles
  const realPhase = actualGoalPhase(m)
  if (pred.goal_phase && realPhase && pred.goal_phase === realPhase) b.goal_phase = s.goal_phase
  // 🥅 Penaltis
  if (pred.penalties && hadPenalties(m)) b.penalties = s.penalties

  b.total = b.winner + b.winner_goals + b.scorer + b.corners + b.goal_phase + b.penalties
  return b
}
