import { adminDb, fetchAllPredictions, type Match } from './db'
import { isKnockout, multiplierFor, pointsFor, scorerBonus, scorerRoundApplies, type Scoring } from './scoring'

export type AuditResult = {
  ok: boolean
  ranAt: string
  problems: string[]
  stats: {
    preds: number
    finishedNoScore: number
    scoredButScheduled: number
    miscalculated: number
    nullPoints: number
    duplicates: number
    tablePlayers: number
  }
}

// Auditoría de integridad de puntajes. Reutiliza la MISMA lógica de scoring.ts,
// así que si el cálculo del producto cambia, la auditoría cambia con él.
export async function runAudit(): Promise<AuditResult> {
  const db = adminDb()
  const [{ data: matches }, { data: parts }, { data: cfg }] = await Promise.all([
    db.from('matches').select('*').order('id'),
    db.from('participants').select('id, name, nickname, is_admin'),
    db.from('settings').select('value').eq('key', 'scoring').single(),
  ])
  const s = cfg!.value as Scoring
  const all = (matches ?? []) as Match[]
  const byId = new Map(all.map((m) => [m.id, m]))
  const preds = (await fetchAllPredictions(db, 'participant_id, match_id, home_score, away_score, points, pred_scorers')) as {
    participant_id: string; match_id: number; home_score: number; away_score: number; points: number | null; pred_scorers: string[] | null
  }[]

  const problems: string[] = []

  // [1] finalizados sin marcador
  const finishedNoScore = all.filter((m) => m.status === 'finished' && (m.home_score == null || m.away_score == null))
  if (finishedNoScore.length) problems.push(`${finishedNoScore.length} partido(s) finalizados sin marcador: ${finishedNoScore.map((m) => m.id).join(', ')}`)

  // [2] con marcador pero 'scheduled'
  const scoredButScheduled = all.filter((m) => m.home_score != null && m.status === 'scheduled')
  if (scoredButScheduled.length) problems.push(`${scoredButScheduled.length} con marcador pero en 'scheduled': ${scoredButScheduled.map((m) => m.id).join(', ')}`)

  // [3]/[4] puntos mal calculados o NULL en finalizados; y puntos en no-finalizados
  let miscalculated = 0, nullPoints = 0
  const detail: string[] = []
  for (const p of preds) {
    const m = byId.get(p.match_id)
    if (!m) continue
    if (m.status === 'finished' && m.home_score != null && m.away_score != null) {
      if (p.points == null) nullPoints++
      let should = pointsFor(
        { home: p.home_score, away: p.away_score },
        { home: m.home_score, away: m.away_score },
        multiplierFor(m.id, m.round, s),
        s,
        isKnockout(m.round)
      )
      if (scorerRoundApplies(m.round)) should += scorerBonus(p.pred_scorers, m.goals, s)
      if ((p.points ?? 0) !== should) {
        miscalculated++
        if (detail.length < 15) detail.push(`m${m.id} ${p.home_score}-${p.away_score}: tiene ${p.points}, debe ${should}`)
      }
    } else if (m.status !== 'finished' && p.points != null) {
      miscalculated++
      if (detail.length < 15) detail.push(`puntos en no-finalizado m${m.id}: ${p.points}`)
    }
  }
  if (miscalculated) problems.push(`${miscalculated} pronóstico(s) con puntos incorrectos${detail.length ? ' (' + detail.slice(0, 5).join('; ') + '…)' : ''}`)
  if (nullPoints) problems.push(`${nullPoints} pronóstico(s) finalizados con puntos NULL`)

  // [5] duplicados
  const seen = new Set<string>()
  let duplicates = 0
  for (const p of preds) {
    const k = `${p.participant_id}_${p.match_id}`
    if (seen.has(k)) duplicates++
    else seen.add(k)
  }
  if (duplicates) problems.push(`${duplicates} pronóstico(s) duplicados (mismo jugador + partido)`)

  // [6] jugadores en tabla (excluye admin e invitado)
  const players = (parts ?? []).filter((p) => !p.is_admin && p.name.toLowerCase() !== 'invitado')
  const tablePlayers = players.length

  const ranAt = new Date().toISOString()
  return {
    ok: problems.length === 0,
    ranAt,
    problems,
    stats: { preds: preds.length, finishedNoScore: finishedNoScore.length, scoredButScheduled: scoredButScheduled.length, miscalculated, nullPoints, duplicates, tablePlayers },
  }
}
