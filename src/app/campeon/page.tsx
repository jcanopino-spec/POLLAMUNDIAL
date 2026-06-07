import { redirect } from 'next/navigation'
import Nav from '@/components/Nav'
import PicksEditor from '@/components/PicksEditor'
import { adminDb } from '@/lib/db'
import { getSession } from '@/lib/session'
import { type Scoring } from '@/lib/scoring'
import { formatKickoff, teamLabel } from '@/lib/teams'

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
    <div className="flex-1">
      <Nav session={session} active="campeon" />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-lg font-bold">💰 Tus apuestas grandes</h1>
        <p className="text-xs text-slate-400 mt-1 mb-5">
          {locked ? (
            <>⛔ El Mundial ya comenzó: quedaron selladas. Tus finalistas: {me?.finalist1 ? teamLabel(me.finalist1) : '—'} y {me?.finalist2 ? teamLabel(me.finalist2) : '—'} · Campeón: {me?.champion_team ? `👑 ${teamLabel(me.champion_team)}` : '—'}</>
          ) : (
            opener && <>Puedes cambiarlas hasta el pitazo inicial ({formatKickoff(opener.kickoff_utc)}, hora colombiana). Después, Zayu 🐆 no negocia.</>
          )}
        </p>
        <PicksEditor
          initial={{ finalist1: me?.finalist1 ?? null, finalist2: me?.finalist2 ?? null, champion: me?.champion_team ?? null }}
          locked={locked}
          finalistBonus={scoring?.finalist_bonus ?? 15}
          championBonus={scoring?.champion_bonus ?? 30}
        />
      </main>
    </div>
  )
}
