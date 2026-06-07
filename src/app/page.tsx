import Link from 'next/link'
import { redirect } from 'next/navigation'
import Nav from '@/components/Nav'
import MatchCard from '@/components/MatchCard'
import { adminDb, type Match } from '@/lib/db'
import { getSession } from '@/lib/session'
import { ROUND_LABEL, type Scoring } from '@/lib/scoring'
import { formatKickoff } from '@/lib/teams'
import { syncResults } from '@/lib/sync'

export const dynamic = 'force-dynamic'

const ROUND_CHIP: Record<number, string> = {
  1: 'Fecha 1', 2: 'Fecha 2', 3: 'Fecha 3', 4: '16avos',
  5: 'Octavos', 6: 'Cuartos', 7: 'Semis', 8: 'Final',
}

export default async function FixturePage({
  searchParams,
}: {
  searchParams: Promise<{ ronda?: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  // Actualización perezosa: sincroniza resultados si han pasado >5 min.
  await syncResults().catch(() => {})

  const db = adminDb()
  const [{ data: matches }, { data: preds }, { data: cfg }, { data: me }] = await Promise.all([
    db.from('matches').select('*').order('kickoff_utc').order('id'),
    db.from('predictions').select('*').eq('participant_id', session.id),
    db.from('settings').select('value').eq('key', 'scoring').single(),
    db.from('participants').select('must_change_pin, champion_team, finalist1, finalist2').eq('id', session.id).single(),
  ])
  // Primer ingreso pendiente → a la bienvenida (PIN nuevo y apuestas grandes primero)
  const all0 = (matches ?? []) as Match[]
  const opener = all0.find((m) => m.id === 1)
  const tournamentStarted = !!opener && new Date(opener.kickoff_utc).getTime() <= Date.now()
  if (me && (me.must_change_pin || (!tournamentStarted && (!me.champion_team || !me.finalist1 || !me.finalist2)))) {
    redirect('/bienvenida')
  }
  const all = all0
  const myPreds = new Map((preds ?? []).map((p) => [p.match_id, p]))
  const scoring = cfg?.value as Scoring

  const { ronda } = await searchParams
  const currentRound = all.find((m) => m.status !== 'finished')?.round ?? 8
  const round = Math.min(8, Math.max(1, Number(ronda) || currentRound))
  const shown = all.filter((m) => m.round === round)
  const now = Date.now()

  // Agrupar por día (hora de Colombia)
  const dayFmt = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Bogota',
  })
  const byDay = new Map<string, Match[]>()
  for (const m of shown) {
    const day = dayFmt.format(new Date(m.kickoff_utc))
    byDay.set(day, [...(byDay.get(day) ?? []), m])
  }

  const mult = scoring?.multipliers?.[String(round)] ?? 1
  const exactPts = (scoring?.exact ?? 5) * mult
  const outcomePts = (scoring?.outcome ?? 2) * mult

  return (
    <div className="flex-1">
      <Nav session={session} active="fixture" />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {Object.entries(ROUND_CHIP).map(([r, label]) => (
            <Link
              key={r}
              href={`/?ronda=${r}`}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                Number(r) === round ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-600'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div>
          <h1 className="text-lg font-bold">{ROUND_LABEL[round]}</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Marcador exacto <span className="text-emerald-400 font-semibold">{exactPts} pts</span> · Solo
            resultado <span className="text-emerald-400 font-semibold">{outcomePts} pts</span>
            {round === 8 && scoring && (
              <> · La final vale exacto {scoring.exact * scoring.final_multiplier} / resultado {scoring.outcome * scoring.final_multiplier}</>
            )}
            {' '}· Se bloquea al inicio de cada partido (se compara el marcador final, sin penales).
          </p>
        </div>

        {[...byDay.entries()].map(([day, ms]) => (
          <section key={day}>
            <h2 className="text-sm font-semibold text-emerald-400/90 capitalize mb-2">{day}</h2>
            <div className="space-y-2">
              {ms.map((m) => {
                const pred = myPreds.get(m.id)
                return (
                  <div key={m.id} className="relative">
                    {m.group_name && (
                      <span className="absolute -top-1.5 right-2 text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded z-[1]">
                        Grupo {m.group_name}
                      </span>
                    )}
                    <MatchCard
                      matchId={m.id}
                      home={m.home_team}
                      away={m.away_team}
                      kickoffLabel={formatKickoff(m.kickoff_utc)}
                      venue={m.venue}
                      locked={new Date(m.kickoff_utc).getTime() <= now}
                      status={m.status}
                      actualHome={m.home_score}
                      actualAway={m.away_score}
                      initialHome={pred?.home_score ?? null}
                      initialAway={pred?.away_score ?? null}
                      points={pred?.points ?? null}
                      maxExact={exactPts}
                    />
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}
