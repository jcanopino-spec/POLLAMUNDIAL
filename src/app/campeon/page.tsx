import { redirect } from 'next/navigation'
import Nav from '@/components/Nav'
import ChampionPicker from '@/components/ChampionPicker'
import { adminDb } from '@/lib/db'
import { getSession } from '@/lib/session'
import { type Scoring } from '@/lib/scoring'
import { formatKickoff } from '@/lib/teams'

export const dynamic = 'force-dynamic'

export default async function CampeonPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const db = adminDb()
  const [{ data: me }, { data: opener }, { data: cfg }] = await Promise.all([
    db.from('participants').select('champion_team').eq('id', session.id).single(),
    db.from('matches').select('kickoff_utc').eq('id', 1).single(),
    db.from('settings').select('value').eq('key', 'scoring').single(),
  ])

  const locked = !!opener && new Date(opener.kickoff_utc).getTime() <= Date.now()
  const scoring = cfg?.value as Scoring

  return (
    <div className="flex-1">
      <Nav session={session} active="campeon" />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-lg font-bold">🏆 ¿Quién será el campeón?</h1>
        <p className="text-xs text-slate-400 mt-1 mb-5">
          Vale <span className="text-amber-400 font-semibold">{scoring?.champion_bonus ?? 30} puntos</span> si
          aciertas.{' '}
          {locked ? (
            <span className="text-red-400">⛔ El Mundial ya comenzó: la elección está cerrada.</span>
          ) : (
            opener && <>Puedes cambiarlo hasta el partido inaugural ({formatKickoff(opener.kickoff_utc)} Col).</>
          )}
        </p>
        <ChampionPicker initial={me?.champion_team ?? null} locked={locked} />
      </main>
    </div>
  )
}
