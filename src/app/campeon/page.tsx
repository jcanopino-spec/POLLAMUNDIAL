import { redirect } from 'next/navigation'
import Nav from '@/components/Nav'
import PicksEditor from '@/components/PicksEditor'
import { adminDb } from '@/lib/db'
import { getSession } from '@/lib/session'
import { type Scoring } from '@/lib/scoring'
import { formatKickoff, teamFlag, teamShort } from '@/lib/teams'

export const dynamic = 'force-dynamic'

export default async function ApuestasPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const db = adminDb()
  const [{ data: me }, { data: opener }, { data: cfg }] = await Promise.all([
    db.from('participants').select('champion_team, finalist1, finalist2').eq('id', session.id).single(),
    db.from('matches').select('kickoff_utc').eq('id', 1).single(),
    db.from('settings').select('value').eq('key', 'scoring').single(),
  ])

  const locked = !!opener && new Date(opener.kickoff_utc).getTime() <= Date.now()
  const scoring = cfg?.value as Scoring

  return (
    <div className="shell">
      <div className="shell-content fade relative">
        <span className="trophy-watermark" aria-hidden>🏆</span>
        <div className="appbar relative z-[1]">
          <div>
            <div className="kicker">💰 Las grandes</div>
            <h2 className="display"><span className="trophy-float">🏆</span> Apuestas</h2>
          </div>
          <span className="pill" style={{ background: 'var(--yellow)' }}>👑 +{scoring?.champion_bonus ?? 30}</span>
        </div>
        <p className="px-[18px] pb-4 text-xs font-bold -mt-1" style={{ color: 'var(--muted)' }}>
          {locked ? (
            <>⛔ Selladas. Tus finalistas: {me?.finalist1 ? `${teamFlag(me.finalist1)} ${teamShort(me.finalist1)}` : '—'} y {me?.finalist2 ? `${teamFlag(me.finalist2)} ${teamShort(me.finalist2)}` : '—'} · Campeón: {me?.champion_team ? `👑 ${teamFlag(me.champion_team)} ${teamShort(me.champion_team)}` : '—'}</>
          ) : (
            opener && <>Puedes cambiarlas hasta el pitazo inicial ({formatKickoff(opener.kickoff_utc)}, hora Col). Después, la gallina 🐔 no negocia.</>
          )}
        </p>
        <PicksEditor
          initial={{ finalist1: me?.finalist1 ?? null, finalist2: me?.finalist2 ?? null, champion: me?.champion_team ?? null }}
          locked={locked}
          finalistBonus={scoring?.finalist_bonus ?? 15}
          championBonus={scoring?.champion_bonus ?? 30}
        />
        <div className="spacer" />
      </div>
      <Nav session={session} active="campeon" />
    </div>
  )
}
