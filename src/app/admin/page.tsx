import { redirect } from 'next/navigation'
import Nav from '@/components/Nav'
import { LiveScoreAdmin, ParticipantsAdmin, PicksReportAdmin, PlantillaAdmin, ProgressAdmin, ResultsAdmin, SyncAdmin, type PicksRow, type ProgressRow } from '@/components/AdminPanel'
import { adminDb, fetchAllPredictions } from '@/lib/db'
import { getSession } from '@/lib/session'
import { formatKickoff } from '@/lib/teams'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!session.isAdmin) redirect('/')

  const db = adminDb()
  const [{ data: participants }, { data: matches }, { data: sync }, { data: allMatches }, allPredsRaw] = await Promise.all([
    db.from('participants').select('id, name, is_admin, champion_team, finalist1, finalist2, must_change_pin, house_number, nickname').order('name'),
    db.from('matches').select('id, home_team, away_team, kickoff_utc, status').lte('kickoff_utc', new Date(Date.now() + 24 * 3600 * 1000).toISOString()).order('kickoff_utc', { ascending: false }),
    db.from('settings').select('value').eq('key', 'last_sync').maybeSingle(),
    db.from('matches').select('id, kickoff_utc'),
    fetchAllPredictions(db, 'participant_id, match_id'),
  ])
  const allPreds = allPredsRaw as { participant_id: string; match_id: number }[]

  // Avance de pronósticos: solo jugadores (no admin), sobre partidos aún por jugar
  const now = Date.now()
  const futureIds = new Set((allMatches ?? []).filter((m) => new Date(m.kickoff_utc).getTime() > now).map((m) => m.id))
  const byUser = new Map<string, Set<number>>()
  for (const p of allPreds ?? []) {
    if (!byUser.has(p.participant_id)) byUser.set(p.participant_id, new Set())
    byUser.get(p.participant_id)!.add(p.match_id)
  }
  const progressRows: ProgressRow[] = (participants ?? [])
    .filter((p) => !p.is_admin)
    .map((p) => {
      const mine = byUser.get(p.id) ?? new Set<number>()
      const filledFuture = [...mine].filter((id) => futureIds.has(id)).length
      return {
        id: p.id,
        display: p.nickname || p.name,
        house: p.house_number,
        neverEntered: p.must_change_pin,
        noPicks: !p.champion_team,
        filledFuture,
        totalFuture: futureIds.size,
        filledAll: mine.size,
      }
    })
    .sort((a, b) => Number(b.neverEntered) - Number(a.neverEntered) || (b.totalFuture - b.filledFuture) - (a.totalFuture - a.filledFuture))

  // Reporte de apuestas grandes: completas primero, luego pendientes
  const picksRows: PicksRow[] = (participants ?? [])
    .filter((p) => !p.is_admin)
    .map((p) => ({
      id: p.id,
      display: p.nickname || p.name,
      house: p.house_number,
      finalist1: p.finalist1,
      finalist2: p.finalist2,
      champion: p.champion_team,
    }))
    .sort((a, b) => {
      const ca = a.finalist1 && a.finalist2 && a.champion ? 0 : 1
      const cb = b.finalist1 && b.finalist2 && b.champion ? 0 : 1
      return ca - cb || a.display.localeCompare(b.display)
    })

  const lastSync = sync?.value?.at
    ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota' }).format(new Date(sync.value.at))
    : null

  return (
    <div className="shell">
      <div className="shell-content fade">
        <div className="appbar">
          <div>
            <div className="kicker">🛠️ El que manda</div>
            <h2 className="display">Admin</h2>
          </div>
          <span className="pill" style={{ background: 'var(--yellow)' }}>🐔 jefe</span>
        </div>
        <PicksReportAdmin rows={picksRows} />
        <ProgressAdmin rows={progressRows} totalMatches={(allMatches ?? []).length} />
        <ParticipantsAdmin participants={participants ?? []} myId={session.id} />
        <LiveScoreAdmin
          matches={(matches ?? []).map((m) => ({
            id: m.id,
            home_team: m.home_team,
            away_team: m.away_team,
            status: m.status,
            kickoffLabel: formatKickoff(m.kickoff_utc),
          }))}
        />
        <ResultsAdmin
          matches={(matches ?? []).map((m) => ({
            id: m.id,
            home_team: m.home_team,
            away_team: m.away_team,
            status: m.status,
            kickoffLabel: formatKickoff(m.kickoff_utc),
          }))}
        />
        <SyncAdmin lastSync={lastSync} />
        <PlantillaAdmin />
        <div className="spacer" />
      </div>
      <Nav session={session} active="admin" />
    </div>
  )
}
