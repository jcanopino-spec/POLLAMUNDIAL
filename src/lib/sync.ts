import { adminDb, type MatchStats } from './db'
import { isKnockout, multiplierFor, pointsFor, type Scoring } from './scoring'

const FEED = 'https://fixturedownload.com/feed/json/fifa-world-cup-2026'
const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard'
// Throttle adaptivo: con partidos en curso sincroniza casi en tiempo real (30s),
// si no hay nada jugándose se relaja a 5 min para no golpear ESPN en vano.
const LIVE_STALE_MS = 30 * 1000
const IDLE_STALE_MS = 5 * 60 * 1000
const LIVE_WINDOW_MS = 2.5 * 60 * 60 * 1000 // un partido se considera "en juego" hasta 2.5h tras el pitazo

// ---- ESPN: marcador en tiempo real + goleadores (fuente principal) ----
// Normaliza nombres de equipo (ESPN → nombre del feed/BD) para emparejar partidos.
function canon(name: string): string {
  const n = name
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z ]/g, '').trim()
  const alias: Record<string, string> = {
    'south korea': 'korea republic', 'korea republic': 'korea republic',
    'czech republic': 'czechia', czechia: 'czechia',
    'united states': 'usa', usa: 'usa', 'usa men': 'usa',
    turkiye: 'turkiye', turkey: 'turkiye',
    iran: 'ir iran', 'ir iran': 'ir iran',
    'ivory coast': 'cote divoire', 'cote divoire': 'cote divoire',
    'cape verde': 'cabo verde', 'cabo verde': 'cabo verde',
    'dr congo': 'congo dr', 'congo dr': 'congo dr', 'democratic republic of the congo': 'congo dr',
    curacao: 'curacao',
  }
  return alias[n] ?? n
}

type EspnGame = {
  home: string; away: string
  homeScore: number; awayScore: number
  state: 'pre' | 'in' | 'post'
  minute: string; scorers: string; winner: string | null
  goalsMeta: { name: string; teamId: string; min: string }[]
  stats: MatchStats | null
  odds: { h: number; d: number; a: number; prov: string } | null
}

// Americano (+220 / -115) → decimal (formato casas de apuestas Colombia)
function toDecimal(american: string | undefined): number | null {
  if (!american) return null
  const n = Number(american.replace('+', ''))
  if (!Number.isFinite(n) || n === 0) return null
  const dec = n > 0 ? n / 100 + 1 : 100 / Math.abs(n) + 1
  return Math.round(dec * 100) / 100
}

async function fetchEspn(dateYmd: string): Promise<EspnGame[]> {
  const res = await fetch(`${ESPN}?dates=${dateYmd}`, {
    cache: 'no-store',
    headers: { 'User-Agent': 'Mozilla/5.0 PollaAlameda' },
  })
  if (!res.ok) return []
  const data = await res.json()
  const out: EspnGame[] = []
  for (const ev of data.events ?? []) {
    const c = ev.competitions?.[0]
    if (!c) continue
    const comps = c.competitors ?? []
    const H = comps.find((x: { homeAway: string }) => x.homeAway === 'home')
    const A = comps.find((x: { homeAway: string }) => x.homeAway === 'away')
    if (!H || !A) continue
    const state = ev.status?.type?.state as 'pre' | 'in' | 'post'
    // goleadores en orden (texto para mostrar + estructura con equipo para la tabla de goleadores)
    const goals: string[] = []
    const goalsMeta: { name: string; teamId: string; min: string }[] = []
    const teamById: Record<string, string> = { [H.team?.id]: H.team?.displayName ?? '', [A.team?.id]: A.team?.displayName ?? '' }
    for (const d of c.details ?? []) {
      if (!d.scoringPlay) continue
      const ath = (d.athletesInvolved ?? [])[0]
      const nm = ath?.shortName ?? ath?.displayName ?? d.type?.text ?? 'Gol'
      const min = d.clock?.displayValue ?? ''
      const og = d.ownGoal ? ' (a.p.)' : ''
      const pen = d.penaltyKick ? ' (pen)' : ''
      goals.push(`${min} ${nm}${og}${pen}`.trim())
      if (!d.ownGoal) goalsMeta.push({ name: nm, teamId: teamById[d.team?.id] ?? '', min })
    }
    const minute = state === 'post' ? 'FINAL' : (ev.status?.displayClock || ev.status?.type?.shortDetail || 'EN VIVO')

    // Tarjetas (con minuto) y estadísticas por equipo
    const cards: string[] = []
    for (const d of c.details ?? []) {
      if (!d.yellowCard && !d.redCard) continue
      const ath = (d.athletesInvolved ?? [])[0]
      const nm = ath?.shortName ?? ath?.displayName ?? ''
      const min = d.clock?.displayValue ?? ''
      cards.push(`${d.redCard ? '🟥' : '🟨'} ${nm} ${min}`.trim())
    }
    const WANT: Record<string, string> = {
      possessionPct: 'Posesión %', totalShots: 'Tiros', shotsOnTarget: 'Tiros al arco',
      wonCorners: 'Córners', foulsCommitted: 'Faltas', goalAssists: 'Asistencias',
    }
    const grab = (comp: typeof H) => {
      const o: Record<string, string> = {}
      for (const s of comp.statistics ?? []) if (WANT[s.name]) o[WANT[s.name]] = String(s.displayValue)
      return o
    }
    const hasStats = (H.statistics ?? []).length > 0
    const stats: MatchStats | null = state === 'pre' || !hasStats ? null : {
      attendance: c.attendance ? Number(c.attendance) : undefined,
      cards: cards.join(', ') || undefined,
      home: grab(H), away: grab(A),
    }

    // Cuotas 1X2 (local/empate/visita) del proveedor de ESPN.
    // Antes del partido ESPN usa close/open (no current); en vivo usa current.
    let odds: EspnGame['odds'] = null
    const o = (c.odds ?? [])[0]
    const pick = (side: { current?: { odds?: string }; close?: { odds?: string }; open?: { odds?: string } } | undefined) =>
      side?.current?.odds ?? side?.close?.odds ?? side?.open?.odds
    if (o?.moneyline) {
      const h = toDecimal(pick(o.moneyline.home))
      const a = toDecimal(pick(o.moneyline.away))
      const dr2 = toDecimal(pick(o.moneyline.draw))
        ?? toDecimal(o.drawOdds?.moneyLine != null ? (o.drawOdds.moneyLine > 0 ? `+${o.drawOdds.moneyLine}` : `${o.drawOdds.moneyLine}`) : undefined)
      if (h && a && dr2) odds = { h, d: dr2, a, prov: o.provider?.name ?? 'Casa' }
    }

    out.push({
      home: H.team?.displayName ?? '', away: A.team?.displayName ?? '',
      homeScore: Number(H.score ?? 0), awayScore: Number(A.score ?? 0),
      state, minute, scorers: goals.join(', '), goalsMeta,
      winner: H.winner ? (H.team?.displayName ?? null) : A.winner ? (A.team?.displayName ?? null) : null,
      stats, odds,
    })
  }
  return out
}

// Empareja juegos de ESPN con los partidos de la BD (por nombres de equipo) y
// actualiza marcador, estado, minuto y goleadores. Devuelve cuántos finalizaron.
async function syncFromEspn(db: ReturnType<typeof adminDb>): Promise<number> {
  const now = new Date()
  const ymd = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '')
  const ayer = new Date(now.getTime() - 24 * 3600 * 1000)
  const manana = new Date(now.getTime() + 24 * 3600 * 1000)
  const dates = [...new Set([ymd(ayer), ymd(now), ymd(manana)])]

  const games = (await Promise.all(dates.map((d) => fetchEspn(d).catch(() => [])))).flat()
  if (!games.length) return 0

  const { data: dbMatches } = await db.from('matches').select('id, home_team, away_team, winner')
  let finished = 0
  for (const g of games) {
    const gh = canon(g.home), ga = canon(g.away)
    const m = (dbMatches ?? []).find(
      (x) => (canon(x.home_team) === gh && canon(x.away_team) === ga) || (canon(x.home_team) === ga && canon(x.away_team) === gh)
    )
    if (!m) continue
    // ¿ESPN tiene local/visita al revés de nuestra BD? Reorienta marcador y stats.
    const flip = canon(m.home_team) === ga
    const hs = flip ? g.awayScore : g.homeScore
    const as = flip ? g.homeScore : g.awayScore
    const status = g.state === 'post' ? 'finished' : g.state === 'in' ? 'live' : 'scheduled'
    const stats = g.stats
      ? { ...g.stats, home: flip ? g.stats.away : g.stats.home, away: flip ? g.stats.home : g.stats.away }
      : null
    // Cuotas: reorienta local/visita si ESPN los trae al revés
    const odds = g.odds ? (flip ? { ...g.odds, h: g.odds.a, a: g.odds.h } : g.odds) : null
    // Goleadores con equipo mapeado al nombre de nuestra BD
    const goals = g.goalsMeta.map((gm) => ({
      name: gm.name,
      team: canon(gm.teamId) === canon(m.home_team) ? m.home_team : canon(gm.teamId) === canon(m.away_team) ? m.away_team : gm.teamId,
      min: gm.min,
    }))
    await db.from('matches').update({
      home_score: g.state === 'pre' ? null : hs,
      away_score: g.state === 'pre' ? null : as,
      winner: g.winner ? (canon(g.winner) === canon(m.home_team) ? m.home_team : m.away_team) : m.winner,
      minute: g.state === 'pre' ? null : g.minute,
      scorers: g.scorers || null,
      ...(goals.length ? { goals } : {}),
      stats,
      ...(odds ? { odds } : {}),
      status,
      manual_result: true, // ESPN manda sobre fixturedownload
      updated_at: new Date().toISOString(),
    }).eq('id', m.id)
    if (status === 'finished') finished++
  }
  return finished
}

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
    const now = Date.now()
    // ¿Hay algún partido en su ventana de juego ahora mismo? (varios simultáneos cuentan igual)
    const { data: playing } = await db
      .from('matches')
      .select('id')
      .gte('kickoff_utc', new Date(now - LIVE_WINDOW_MS).toISOString())
      .lte('kickoff_utc', new Date(now).toISOString())
      .limit(1)
    const stale = playing?.length ? LIVE_STALE_MS : IDLE_STALE_MS
    const { data } = await db.from('settings').select('value').eq('key', 'last_sync').maybeSingle()
    const last = data?.value?.at ? new Date(data.value.at).getTime() : 0
    if (now - last < stale) return { synced: false }
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

  // ESPN manda: marcador real, estado, minuto y goleadores (corre después del feed,
  // que ya resolvió los nombres de equipos en eliminatorias).
  await syncFromEspn(db).catch(() => {})

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

  // Trae TODOS los pronósticos de partidos finalizados con paginación
  // (Supabase corta en 1000 filas; con 30 jugadores eso son <34 partidos).
  const finishedIds = finished.map((m) => m.id)
  const preds: { participant_id: string; match_id: number; home_score: number; away_score: number; points: number | null }[] = []
  for (let from = 0; ; from += 1000) {
    const { data: batch, error } = await db
      .from('predictions')
      .select('participant_id, match_id, home_score, away_score, points')
      .in('match_id', finishedIds)
      .range(from, from + 999)
    if (error) throw error
    if (!batch?.length) break
    preds.push(...batch)
    if (batch.length < 1000) break
  }

  const changed = preds.flatMap((p) => {
    const m = byId.get(p.match_id)!
    const pts = pointsFor(
      { home: p.home_score, away: p.away_score },
      { home: m.home_score!, away: m.away_score! },
      multiplierFor(m.id, m.round, scoring),
      scoring,
      isKnockout(m.round)
    )
    return pts === p.points ? [] : [{ ...p, points: pts, updated_at: new Date().toISOString() }]
  })

  if (changed.length) {
    const { error } = await db.from('predictions').upsert(changed)
    if (error) throw error
  }
  return finished.length
}
