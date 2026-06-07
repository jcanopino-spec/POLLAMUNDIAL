import { redirect } from 'next/navigation'
import Nav from '@/components/Nav'
import WelcomeWizard from '@/components/WelcomeWizard'
import { Confetti } from '@/components/Fiesta'
import { adminDb } from '@/lib/db'
import { getSession } from '@/lib/session'
import { type Scoring } from '@/lib/scoring'
import { formatKickoff } from '@/lib/teams'

export const dynamic = 'force-dynamic'

export default async function BienvenidaPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const db = adminDb()
  const [{ data: me }, { data: opener }, { data: cfg }] = await Promise.all([
    db.from('participants').select('must_change_pin, champion_team, finalist1, finalist2').eq('id', session.id).single(),
    db.from('matches').select('kickoff_utc').eq('id', 1).single(),
    db.from('settings').select('value').eq('key', 'scoring').single(),
  ])
  if (!me) redirect('/login')

  const scoring = cfg?.value as Scoring
  const picksLocked = !!opener && new Date(opener.kickoff_utc).getTime() <= Date.now()

  return (
    <div className="flex-1 relative">
      <Confetti density={0.5} />
      <Nav session={session} active="reglas" />
      <WelcomeWizard
        name={session.name}
        mustChangePin={me.must_change_pin}
        picks={{ finalist1: me.finalist1, finalist2: me.finalist2, champion: me.champion_team }}
        picksLocked={picksLocked}
        openerLabel={opener ? formatKickoff(opener.kickoff_utc) : '11 de junio'}
        scoring={scoring}
      />
    </div>
  )
}
