import { redirect } from 'next/navigation'
import Nav from '@/components/Nav'
import { adminDb, type Participant } from '@/lib/db'
import { getSession } from '@/lib/session'
import { FINAL_MATCH_ID, type Scoring } from '@/lib/scoring'
import { isPlaceholder, teamLabel } from '@/lib/teams'
import { syncResults } from '@/lib/sync'

export const dynamic = 'force-dynamic'

export default async function PosicionesPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  await syncResults().catch(() => {})

  const db = adminDb()
  const [{ data: participants }, { data: preds }, { data: finished }, { data: cfg }, { data: final }] =
    await Promise.all([
      db.from('participants').select('id, name, is_admin, champion_team, finalist1, finalist2, house_number, nickname'),
      db.from('predictions').select('participant_id, match_id, home_score, away_score, points').not('points', 'is', null),
      db.from('matches').select('id, home_score, away_score').eq('status', 'finished'),
      db.from('settings').select('value').eq('key', 'scoring').single(),
      db.from('matches').select('home_team, away_team, winner, status').eq('id', FINAL_MATCH_ID).single(),
    ])

  const scoring = cfg?.value as Scoring
  const actual = new Map((finished ?? []).map((m) => [m.id, m]))
  const champion = final?.status === 'finished' ? final.winner : null
  // Los finalistas reales se conocen cuando el partido 104 ya tiene equipos (no placeholders tipo 'W101')
  const realFinalists =
    final && !isPlaceholder(final.home_team) && !isPlaceholder(final.away_team)
      ? [final.home_team, final.away_team]
      : []

  const rows = ((participants ?? []) as Participant[]).map((p) => {
    const mine = (preds ?? []).filter((x) => x.participant_id === p.id)
    const matchPoints = mine.reduce((s, x) => s + (x.points ?? 0), 0)
    const exact = mine.filter((x) => {
      const m = actual.get(x.match_id)
      return m && x.home_score === m.home_score && x.away_score === m.away_score
    }).length
    const outcome = mine.filter((x) => (x.points ?? 0) > 0).length - exact
    const championHit = champion != null && p.champion_team === champion
    const finalistHits = [p.finalist1, p.finalist2].filter((f) => f && realFinalists.includes(f)).length
    const bonus = (championHit ? (scoring?.champion_bonus ?? 0) : 0) + finalistHits * (scoring?.finalist_bonus ?? 0)
    return { ...p, total: matchPoints + bonus, exact, outcome, championHit, finalistHits, bonus }
  })

  rows.sort((a, b) => b.total - a.total || b.exact - a.exact || a.name.localeCompare(b.name))

  // 🏠 Guerra de casas: suma de los puntos de todos los habitantes
  const houseMap = new Map<string, { total: number; members: typeof rows }>()
  for (const r of rows) {
    const key = r.house_number?.trim() || null
    if (!key) continue
    const h = houseMap.get(key) ?? { total: 0, members: [] as typeof rows }
    h.total += r.total
    h.members.push(r)
    houseMap.set(key, h)
  }
  const houses = [...houseMap.entries()]
    .map(([house, h]) => ({ house, ...h, avg: h.total / h.members.length }))
    .sort((a, b) => b.total - a.total || b.avg - a.avg)

  const medal = (i: number) => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`)
  const played = actual.size

  return (
    <div className="flex-1">
      <Nav session={session} active="posiciones" />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-baseline justify-between mb-4">
          <h1 className="text-lg font-extrabold bg-gradient-to-r from-amber-300 via-emerald-300 to-sky-300 bg-clip-text text-transparent">
            🏆 Tabla de posiciones
          </h1>
          <span className="text-xs text-slate-400">{played} de 104 partidos jugados</span>
        </div>

        {/* Podio de la natillera */}
        {rows.length >= 3 && (
          <div className="grid grid-cols-3 gap-2 items-end mb-5">
            {[rows[1], rows[0], rows[2]].map((r, i) => {
              const pos = i === 1 ? 0 : i === 0 ? 1 : 2
              const alturas = ['h-24', 'h-32', 'h-20']
              const estilos = [
                'from-slate-500/30 to-slate-700/30 border-slate-500/50',
                'from-amber-500/30 to-amber-800/30 border-amber-400/60 glow-gold',
                'from-orange-700/30 to-orange-900/30 border-orange-600/50',
              ]
              return (
                <div
                  key={r.id}
                  className={`${alturas[i]} rounded-t-xl border bg-gradient-to-b ${estilos[i]} flex flex-col items-center justify-end pb-2 px-1`}
                >
                  <span className="text-2xl">{['🥈', '🥇', '🥉'][i]}</span>
                  <span className="text-xs font-bold truncate max-w-full">{r.name}</span>
                  <span className={`text-sm font-extrabold ${pos === 0 ? 'text-amber-300' : 'text-slate-300'}`}>{r.total} pts</span>
                </div>
              )
            })}
          </div>
        )}

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
                    {r.nickname && <span className="text-slate-400 italic text-xs"> “{r.nickname}”</span>}
                    {r.house_number && <span className="text-sky-400/80 text-[10px] ml-1">🏠{r.house_number}</span>}
                    {r.id === session.id && <span className="text-emerald-400 text-xs ml-1">(tú)</span>}
                  </td>
                  <td className="px-2 py-2.5 text-center text-emerald-300">{r.exact}</td>
                  <td className="px-2 py-2.5 text-center text-slate-300">{r.outcome}</td>
                  <td className="px-2 py-2.5 text-center hidden sm:table-cell text-xs">
                    {r.champion_team ? (
                      <span className={r.championHit ? 'text-amber-400 font-bold' : ''}>
                        👑 {teamLabel(r.champion_team)}
                        {r.finalistHits > 0 && <span className="text-emerald-400"> ⭐{r.finalistHits}</span>}
                        {r.bonus > 0 && <span className="text-amber-400"> +{r.bonus}</span>}
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
          🎯 marcadores exactos · ✔️ solo resultado · ⭐ finalistas acertados ({scoring?.finalist_bonus ?? 15} pts c/u) ·
          👑 campeón ({scoring?.champion_bonus ?? 30} pts) · La tabla se actualiza solita al terminar cada partido.
          Maple 🫎, Zayu 🐆 y Clutch 🦅 no aceptan sobornos.
        </p>

        {/* 🏠 Guerra de casas */}
        {houses.length >= 2 && (
          <section className="mt-8">
            <h2 className="text-lg font-extrabold bg-gradient-to-r from-sky-300 via-emerald-300 to-amber-300 bg-clip-text text-transparent mb-1">
              🏠 La guerra de casas
            </h2>
            <p className="text-xs text-slate-400 mb-3">
              Aquí no se salva nadie: los puntos de cada vecino suman para su casa. Honor para una… y sancocho para otra.
            </p>
            <div className="space-y-2">
              {houses.map((h, i) => {
                const first = i === 0
                const last = i === houses.length - 1
                return (
                  <div
                    key={h.house}
                    className={`rounded-xl border p-3 flex items-center gap-3 ${
                      first
                        ? 'border-amber-400/60 bg-gradient-to-r from-amber-950/40 to-slate-900/60 glow-gold'
                        : last
                          ? 'border-rose-800/60 bg-rose-950/20'
                          : 'border-slate-800 bg-slate-900/50'
                    }`}
                  >
                    <span className="text-2xl shrink-0">{first ? '👑' : last ? '🥄' : '🏠'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold">
                        Casa {h.house}
                        <span className="text-xs font-normal text-slate-400 ml-2">
                          {first
                            ? '— aquí SÍ se ve fútbol 🔥'
                            : last
                              ? '— van pagando el sancocho 🍲'
                              : ''}
                        </span>
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {h.members.map((m) => m.nickname || m.name).join(' · ')}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-extrabold text-lg">{h.total} pts</p>
                      <p className="text-[10px] text-slate-500">
                        {h.members.length} jugador(es) · prom. {h.avg.toFixed(1)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-[11px] text-slate-600 mt-2">
              * Se suma el total de cada habitante. Casa que invita más gente, suma más… así que recluten 😏
            </p>
          </section>
        )}
      </main>
    </div>
  )
}
