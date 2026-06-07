import { redirect } from 'next/navigation'
import Nav from '@/components/Nav'
import Simulator from '@/components/Simulator'
import { adminDb } from '@/lib/db'
import { getSession } from '@/lib/session'
import type { SimData } from '@/lib/bracket'

export const dynamic = 'force-dynamic'

export default async function SimuladorPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const db = adminDb()
  const [{ data: groupMatches }, { data: sim }, { data: me }] = await Promise.all([
    db.from('matches').select('group_name, home_team, away_team').not('group_name', 'is', null),
    db.from('simulations').select('data').eq('participant_id', session.id).maybeSingle(),
    db.from('participants').select('finalist1, finalist2, champion_team').eq('id', session.id).single(),
  ])

  // grupo → 4 equipos
  const groups: Record<string, string[]> = {}
  for (const m of groupMatches ?? []) {
    const g = m.group_name!
    groups[g] = [...new Set([...(groups[g] ?? []), m.home_team, m.away_team])]
  }

  return (
    <div className="shell">
      <div className="shell-content fade">
        <div className="appbar">
          <div>
            <div className="kicker">🔮 La bola de cristal</div>
            <h2 className="display">Simulador</h2>
          </div>
          <span className="pill" style={{ background: 'var(--yellow)' }}>0 pts · 100% honor</span>
        </div>
        <p className="px-[18px] pb-3 text-xs font-bold -mt-1" style={{ color: 'var(--muted)' }}>
          Arma TU Mundial completo con el bracket real de la FIFA: ordena los grupos, mira los cruces de verdad
          y comprueba si la final que soñaste <b>existe</b>… o si tus finalistas se matan en octavos 😅. No vale
          puntos: vale honor (y sirve pa’ afinar la apuesta grande antes del pitazo).
        </p>
        <Simulator
          groups={groups}
          saved={(sim?.data as SimData) ?? null}
          picks={{ finalist1: me?.finalist1 ?? null, finalist2: me?.finalist2 ?? null, champion: me?.champion_team ?? null }}
        />
        <div className="castigo">
          <div className="big">🔮</div>
          <div className="t">
            Simula sin miedo: aquí nadie te cobra el ridículo. <b>En la polla real sí</b> 😂 — y el último
            pone el guaro y el cerdo 🐷
          </div>
        </div>
        <div className="spacer" />
      </div>
      <Nav session={session} active="simulador" />
    </div>
  )
}
