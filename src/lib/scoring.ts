// Motor de puntos. Regla de la casa: el pronóstico se compara contra el marcador
// final registrado (incluida prórroga, SIN penales). El bono de campeón usa `winner`.

export type Scoring = {
  exact: number
  outcome: number
  multipliers: Record<string, number>
  final_multiplier: number
  champion_bonus: number
}

export const FINAL_MATCH_ID = 104

export function multiplierFor(matchId: number, round: number, s: Scoring): number {
  if (matchId === FINAL_MATCH_ID) return s.final_multiplier
  return s.multipliers[String(round)] ?? 1
}

const sign = (n: number) => (n > 0 ? 1 : n < 0 ? -1 : 0)

export function pointsFor(
  pred: { home: number; away: number },
  actual: { home: number; away: number },
  mult: number,
  s: Scoring
): number {
  if (pred.home === actual.home && pred.away === actual.away) return s.exact * mult
  if (sign(pred.home - pred.away) === sign(actual.home - actual.away)) return s.outcome * mult
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
