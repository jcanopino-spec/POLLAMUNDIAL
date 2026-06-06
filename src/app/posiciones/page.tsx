import { redirect } from 'next/navigation'
import Nav from '@/components/Nav'
import { adminDb, type Participant } from '@/lib/db'
import { getSession } from '@/lib/session'
import { FINAL_MATCH_ID, type Scoring } from '@/lib/scoring'
import { teamLabel } from '@/lib/teams'
import { syncResults } from '@/lib/sync'

export const dynamic = 'force-dynamic'

export default async function PosicionesPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  await syncResults().catch(() => {})

  const db = adminDb()
  const [{ data: participants }, { data: preds }, { data: finished }, { data: cfg }, { data: final }] =
    await Promise.all([
      db.from('participants').select('id, name, is_admin, champion_team'),
      db.from('predictions').select('participant_id, match_id, home_score, away_score, points').not('points', 'is', null),
      db.from('matches').select('id, home_score, away_score').eq('status', 'finished'),
      db.from('settings').select('value').eq('key', 'scoring').single(),
      db.from('matches').select('winner, status').eq('id', FINAL_MATCH_ID).single(),
    ])

  const scoring = cfg?.value as Scoring
  const actual = new Map((finished ?? []).map((m) => [m.id, m]))
  const champion = final?.status === 'finished' ? final.winner : null

  const rows = ((participants ?? []) as Participant[]).map((p) => {
    const mine = (preds ?? []).filter((x) => x.participant_id === p.id)
    const matchPoints = mine.reduce((s, x) => s + (x.points ?? 0), 0)
    const exact = mine.filter((x) => {
      const m = actual.get(x.match_id)
      return m && x.home_score === m.home_score && x.away_score === m.away_score
    }).length
    const outcome = mine.filter((x) => (x.points ?? 0) > 0).length - exact
    const championHit = champion != null && p.champion_team === champion
    const bonus = championHit ? (scoring?.champion_bonus ?? 0) : 0
    return { ...p, total: matchPoints + bonus, exact, outcome, championHit, bonus }
  })

  rows.sort((a, b) => b.total - a.total || b.exact - a.exact || a.name.localeCompare(b.name))

  const medal = (i: number) => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`)
  const played = actual.size

  return (
    <div className="flex-1">
      <Nav session={session} active="posiciones" />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-baseline justify-between mb-4">
          <h1 className="text-lg font-bold">Tabla de posiciones</h1>
          <span className="text-xs text-slate-400">{played} de 104 partidos jugados</span>
        </div>

        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-slate-400 text-xs uppercase">
              <tr>
                <th className="px-3 py-2.5 text-left w-10">#</th>
                <th className="px-2 py-2.5 text-left">Participante</th>
                <th className="px-2 py-2.5 text-center" title="Marcadores exactos">🎯</th>
                <th className="px-2 py-2.5 text-center" title="Solo resultado">✔️</th>
                <th className="px-2 py-2.5 text-center hidden sm:table-cell">Campeón</th>
                <th className="px-3 py-2.5 text-right">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {rows.map((r, i) => (
                <tr key={r.id} className={r.id === session.id ? 'bg-emerald-950/40' : i % 2 ? 'bg-slate-900/40' : ''}>
                  <td className="px-3 py-2.5 font-semibold">{medal(i)}</td>
                  <td className="px-2 py-2.5 font-medium">
                    {r.name}
                    {r.id === session.id && <span className="text-emerald-400 text-xs ml-1">(tú)</span>}
                  </td>
                  <td className="px-2 py-2.5 text-center text-emerald-300">{r.exact}</td>
                  <td className="px-2 py-2.5 text-center text-slate-300">{r.outcome}</td>
                  <td className="px-2 py-2.5 text-center hidden sm:table-cell text-xs">
                    {r.champion_team ? (
                      <span className={r.championHit ? 'text-amber-400 font-bold' : ''}>
                        {teamLabel(r.champion_team)}
                        {r.championHit && ` +${r.bonus}`}
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-base">{r.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-slate-500 mt-3">
          🎯 marcadores exactos · ✔️ solo resultado · La tabla se actualiza automáticamente al finalizar
          cada partido. Bono campeón: {scoring?.champion_bonus ?? 30} pts.
        </p>
      </main>
    </div>
  )
}
