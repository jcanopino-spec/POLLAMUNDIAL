import { adminDb } from './db'
import { multiplierFor, pointsFor, type Scoring } from './scoring'

const FEED = 'https://fixturedownload.com/feed/json/fifa-world-cup-2026'
const STALE_MS = 5 * 60 * 1000 // re-sincronizar máximo cada 5 min

type FeedMatch = {
  MatchNumber: number
  RoundNumber: number
  DateUtc: string
  Location: string
  HomeTeam: string
  AwayTeam: string
  Group: string | null
  HomeTeamScore: number | null
  AwayTeamScore: number | null
  Winner: string
}

// Sincroniza marcadores/equipos desde el feed y recalcula puntos.
// `force` ignora el umbral de 5 minutos (cron y botón del admin).
export async function syncResults(force = false): Promise<{ synced: boolean; finished?: number }> {
  const db = adminDb()

  if (!force) {
    const { data } = await db.from('settings').select('value').eq('key', 'last_sync').maybeSingle()
    const last = data?.value?.at ? new Date(data.value.at).getTime() : 0
    if (Date.now() - last < STALE_MS) return { synced: false }
  }

  const res = await fetch(FEED, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Feed HTTP ${res.status}`)
  const feed: FeedMatch[] = await res.json()
  const now = Date.now()

  // Resultados manuales del admin: se respetan mientras el feed no traiga marcador.
  const { data: manualRows } = await db
    .from('matches')
    .select('id, home_score, away_score, winner, status')
    .eq('manual_result', true)
  const manual = new Map((manualRows ?? []).map((m) => [m.id, m]))

  const rows = feed.map((m) => {
    const kickoff = new Date(m.DateUtc.replace(' ', 'T')).getTime()
    const feedFinished = m.HomeTeamScore != null && m.AwayTeamScore != null
    const live = !feedFinished && now >= kickoff && now < kickoff + 2.5 * 60 * 60 * 1000
    const base = {
      id: m.MatchNumber,
      round: m.RoundNumber,
      group_name: m.Group ? m.Group.replace('Group ', '') : null,
      kickoff_utc: m.DateUtc.replace(' ', 'T'),
      venue: m.Location,
      home_team: m.HomeTeam,
      away_team: m.AwayTeam,
      home_score: m.HomeTeamScore,
      away_score: m.AwayTeamScore,
      winner: m.Winner || null,
      manual_result: false,
      status: feedFinished ? 'finished' : live ? 'live' : 'scheduled',
      updated_at: new Date().toISOString(),
    }
    // El feed aún no trae marcador pero el admin ya lo registró → conservar lo manual.
    const man = manual.get(m.MatchNumber)
    if (!feedFinished && man) {
      return {
        ...base,
        home_score: man.home_score,
        away_score: man.away_score,
        winner: man.winner,
        manual_result: true,
        status: man.status,
      }
    }
    return base
  })

  const { error } = await db.from('matches').upsert(rows)
  if (error) throw error

  const finishedCount = await recomputePoints()

  await db.from('settings').upsert({ key: 'last_sync', value: { at: new Date().toISOString() } })
  return { synced: true, finished: finishedCount }
}

// Recalcula los puntos de TODOS los partidos finalizados (idempotente:
// permite cambiar la configuración de puntaje y corregir resultados).
export async function recomputePoints(): Promise<number> {
  const db = adminDb()

  const [{ data: cfg }, { data: finished }] = await Promise.all([
    db.from('settings').select('value').eq('key', 'scoring').single(),
    db.from('matches').select('id, round, home_score, away_score').eq('status', 'finished'),
  ])
  if (!cfg || !finished?.length) return 0
  const scoring = cfg.value as Scoring
  const byId = new Map(finished.map((m) => [m.id, m]))

  const { data: preds } = await db
    .from('predictions')
    .select('participant_id, match_id, home_score, away_score, points')
    .in('match_id', finished.map((m) => m.id))

  const changed = (preds ?? []).flatMap((p) => {
    const m = byId.get(p.match_id)!
    const pts = pointsFor(
      { home: p.home_score, away: p.away_score },
      { home: m.home_score!, away: m.away_score! },
      multiplierFor(m.id, m.round, scoring),
      scoring
    )
    return pts === p.points ? [] : [{ ...p, points: pts, updated_at: new Date().toISOString() }]
  })

  if (changed.length) {
    const { error } = await db.from('predictions').upsert(changed)
    if (error) throw error
  }
  return finished.length
}
