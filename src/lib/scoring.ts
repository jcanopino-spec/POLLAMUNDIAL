// Motor de puntos. Regla de la casa: el pronóstico se compara contra el marcador
// final registrado (incluida prórroga, SIN penales). El bono de campeón usa `winner`.

export type Scoring = {
  exact: number
  outcome: number
  multipliers: Record<string, number>
  final_multiplier: number
  champion_bonus: number
  finalist_bonus: number
  // Bono extra SOLO en fase de eliminación: acertar el nº de goles del equipo
  // ganador (sin ser marcador exacto) suma estos puntos sobre el acierto de ganador.
  winner_goals_bonus?: number
  // Bono por acertar AUTORES de los goles (desde semifinales): +N por cada
  // goleador real que el jugador haya pronosticado.
  scorer_bonus?: number
}

export const FINAL_MATCH_ID = 104

// La fase de eliminación empieza en la ronda 4 (dieciseisavos). Ahí aplica el
// bono por acertar el nº de goles del ganador.
export function isKnockout(round: number): boolean {
  return round >= 4
}

// El bono por acertar goleadores aplica desde semifinales (ronda 7): semis,
// tercer puesto y final.
export function scorerRoundApplies(round: number): boolean {
  return round >= 7
}

function normName(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

// +scorer_bonus por cada goleador REAL (distinto) que el jugador haya pronosticado.
export function scorerBonus(
  predScorers: string[] | null | undefined,
  actualGoals: { name: string }[] | null | undefined,
  s: Scoring
): number {
  const bonus = s.scorer_bonus ?? 0
  if (!bonus || !predScorers?.length || !actualGoals?.length) return 0
  const pred = new Set(predScorers.map(normName).filter(Boolean))
  const real = new Set(actualGoals.map((g) => normName(g.name)).filter(Boolean))
  let hits = 0
  for (const r of real) if (pred.has(r)) hits++
  return hits * bonus
}

export function multiplierFor(matchId: number, round: number, s: Scoring): number {
  if (matchId === FINAL_MATCH_ID) return s.final_multiplier
  return s.multipliers[String(round)] ?? 1
}

const sign = (n: number) => (n > 0 ? 1 : n < 0 ? -1 : 0)

export function pointsFor(
  pred: { home: number; away: number },
  actual: { home: number; away: number },
  mult: number,
  s: Scoring,
  knockout = false
): number {
  // 🎯 Marcador exacto
  if (pred.home === actual.home && pred.away === actual.away) return s.exact * mult
  // ✅ Acertó el resultado (ganador o empate)
  if (sign(pred.home - pred.away) === sign(actual.home - actual.away)) {
    let pts = s.outcome * mult
    // 🥈 Bono fase final: acertó el nº de goles del equipo ganador (no aplica a empates)
    const bonus = s.winner_goals_bonus ?? 0
    if (knockout && bonus && actual.home !== actual.away) {
      const winnerGoals = Math.max(actual.home, actual.away)
      const predWinnerGoals = actual.home > actual.away ? pred.home : pred.away
      if (predWinnerGoals === winnerGoals) pts += bonus
    }
    return pts
  }
  return 0
}

export const ROUND_LABEL: Record<number, string> = {
  1: 'Fase de grupos · Fecha 1',
  2: 'Fase de grupos · Fecha 2',
  3: 'Fase de grupos · Fecha 3',
  4: 'Dieciseisavos de final',
  5: 'Octavos de final',
  6: 'Cuartos de final',
  7: 'Semifinales',
  8: 'Tercer puesto y Final',
}
