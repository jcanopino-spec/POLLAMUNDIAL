import { redirect } from 'next/navigation'
import Nav from '@/components/Nav'
import { ParticipantsAdmin, ResultsAdmin, SyncAdmin } from '@/components/AdminPanel'
import { adminDb } from '@/lib/db'
import { getSession } from '@/lib/session'
import { formatKickoff } from '@/lib/teams'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!session.isAdmin) redirect('/')

  const db = adminDb()
  const [{ data: participants }, { data: matches }, { data: sync }] = await Promise.all([
    db.from('participants').select('id, name, is_admin, champion_team, house_number, nickname').order('name'),
    db.from('matches').select('id, home_team, away_team, kickoff_utc, status').lte('kickoff_utc', new Date(Date.now() + 24 * 3600 * 1000).toISOString()).order('kickoff_utc', { ascending: false }),
    db.from('settings').select('value').eq('key', 'last_sync').maybeSingle(),
  ])

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
        <ParticipantsAdmin participants={participants ?? []} myId={session.id} />
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
        <div className="spacer" />
      </div>
      <Nav session={session} active="admin" />
    </div>
  )
}
