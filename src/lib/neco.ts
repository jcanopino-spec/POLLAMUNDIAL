// Motor de puntos del evento NECO (por casa, aparte de la app general).
// Reglas: marcador EXACTO 20 · ganador 10 · nº goles del ganador 5 ·
// cada goleador 5 (así sea del perdedor) · córners totales 5 ·
// etapa de CADA gol 5 · penaltis 3.
// Autores y etapas se califican por SEPARADO (multiset): el tiempo en que
// cae un gol no tiene que coincidir con el autor que le asignaste.
import type { Match } from './db'

export const NECO_MATCH_IDS = [103, 104] as const // 🥉 tercer puesto y 🏆 final
export const NECO_EXCLUDED_HOUSE = '2026'          // casa simbólica de invitados (no participa)

export type NecoScoring = {
  exact: number
  winner: number
  winner_goals: number
  scorer: number
  corners: number
  goal_phase: number
  penalties: number
}

export const DEFAULT_NECO_SCORING: NecoScoring = {
  exact: 20, winner: 10, winner_goals: 5, scorer: 5, corners: 5, goal_phase: 5, penalties: 3,
}

export type GoalPhase = '1T' | '2T' | 'ET1' | 'ET2'
export const GOAL_PHASES: GoalPhase[] = ['1T', '2T', 'ET1', 'ET2']
export const PHASE_LABEL: Record<GoalPhase, string> = {
  '1T': 'Primer tiempo',
  '2T': 'Segundo tiempo',
  'ET1': 'Alargue · 1er tiempo',
  'ET2': 'Alargue · 2do tiempo',
}
export const PHASE_SHORT: Record<GoalPhase, string> = {
  '1T': '1er T', '2T': '2do T', 'ET1': 'Alargue 1', 'ET2': 'Alargue 2',
}

export type NecoPrediction = {
  house_number: string
  match_id: number
  home_score: number | null
  away_score: number | null
  scorers: string[]
  corners_total: number | null
  goal_phases: GoalPhase[] // una etapa por gol (multiset; no atada al autor)
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

// Etapa real de CADA gol del partido (una por gol, en orden de minuto).
export function actualGoalPhases(m: Pick<Match, 'goals'>): GoalPhase[] {
  const out: GoalPhase[] = []
  for (const g of m.goals ?? []) {
    const p = phaseFromMinute(g?.min)
    if (p) out.push(p)
  }
  return out
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
  exact: number
  winner: number
  winner_goals: number
  scorer: number
  corners: number
  goal_phase: number
  penalties: number
  total: number
}

export const emptyBreakdown = (): NecoBreakdown => ({
  exact: 0, winner: 0, winner_goals: 0, scorer: 0, corners: 0, goal_phase: 0, penalties: 0, total: 0,
})

// multiset: cuántos de `pred` caen dentro de `real` (con tope por multiplicidad).
function multisetHits(pred: string[] | null | undefined, real: string[]): number {
  const realCount = new Map<string, number>()
  for (const r of real) { const k = normName(r); if (k) realCount.set(k, (realCount.get(k) ?? 0) + 1) }
  const predCount = new Map<string, number>()
  for (const p of pred ?? []) { const k = normName(p); if (k) predCount.set(k, (predCount.get(k) ?? 0) + 1) }
  let hits = 0
  for (const [k, c] of predCount) hits += Math.min(c, realCount.get(k) ?? 0)
  return hits
}

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

  const ph = pred.home_score, pa = pred.away_score
  if (ph != null && pa != null) {
    // 🎯 Marcador EXACTO (independiente del ganador)
    if (ph === m.home_score && pa === m.away_score) b.exact = s.exact
    // 🏆 Ganador
    const predWinner = ph > pa ? m.home_team : pa > ph ? m.away_team : null
    if (predWinner && m.winner && predWinner === m.winner) b.winner = s.winner
    // 🔢 Nº de goles del equipo ganador (lado real del ganador)
    const side = m.winner === m.home_team ? 'home' : m.winner === m.away_team ? 'away' : null
    if (side) {
      const realWG = side === 'home' ? m.home_score : m.away_score
      const predWG = side === 'home' ? ph : pa
      if (predWG === realWG) b.winner_goals = s.winner_goals
    }
  }

  // ⚽ Goleadores (multiset; cuenta el del perdedor, sin importar el tiempo)
  const realScorers = (m.goals ?? []).map((g) => g.name)
  b.scorer = multisetHits(pred.scorers, realScorers) * s.scorer

  // ⏱️ Etapas de los goles (multiset; +5 por cada etapa acertada, aparte del autor)
  const realPhases = actualGoalPhases(m)
  b.goal_phase = multisetHits(pred.goal_phases, realPhases) * s.goal_phase

  // 🚩 Córners totales
  if (actualCorners != null && pred.corners_total != null && pred.corners_total === actualCorners) b.corners = s.corners
  // 🥅 Penaltis
  if (pred.penalties && hadPenalties(m)) b.penalties = s.penalties

  b.total = b.exact + b.winner + b.winner_goals + b.scorer + b.corners + b.goal_phase + b.penalties
  return b
}
