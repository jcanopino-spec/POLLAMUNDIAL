import Link from 'next/link'
import { redirect } from 'next/navigation'
import Nav from '@/components/Nav'
import MatchCard from '@/components/MatchCard'
import { adminDb, type Match } from '@/lib/db'
import { getSession } from '@/lib/session'
import { ROUND_LABEL, type Scoring } from '@/lib/scoring'
import { formatKickoff, teamLabel } from '@/lib/teams'
import { syncResults } from '@/lib/sync'
import {
  dayChipLabel, dayKey, dayLongLabel, dayMonthLabel, FIFA_URL, groupByDay, tvColombia, weekOf,
} from '@/lib/calendar'

export const dynamic = 'force-dynamic'

const ROUND_CHIP: Record<number, string> = {
  1: 'Fecha 1', 2: 'Fecha 2', 3: 'Fecha 3', 4: '16avos',
  5: 'Octavos', 6: 'Cuartos', 7: 'Semis', 8: 'Final',
}

export default async function FixturePage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string; dia?: string; semana?: string; ronda?: string; grupo?: string }>
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
  const all = (matches ?? []) as Match[]
  const opener = all.find((m) => m.id === 1)
  const now = Date.now()
  const tournamentStarted = !!opener && new Date(opener.kickoff_utc).getTime() <= now

  // Primer ingreso pendiente → a la bienvenida (PIN nuevo y apuestas grandes primero)
  if (me && (me.must_change_pin || (!tournamentStarted && (!me.champion_team || !me.finalist1 || !me.finalist2)))) {
    redirect('/bienvenida')
  }

  const myPreds = new Map((preds ?? []).map((p) => [p.match_id, p]))
  const scoring = cfg?.value as Scoring

  // Calendario completo agrupado por día (hora colombiana)
  const allDays = groupByDay(all)
  const firstDay = allDays[0]?.key ?? '2026-06-11'
  const today = dayKey(new Date())
  // Día por defecto: hoy si hay partidos; si no, el próximo día con partidos; si terminó, el último.
  const defaultDay =
    allDays.find((d) => d.key === today)?.key ??
    allDays.find((d) => d.key > today)?.key ??
    allDays[allDays.length - 1]?.key

  const params = await searchParams
  const vista = ['dia', 'semana', 'fase', 'grupo'].includes(params.vista ?? '') ? params.vista! : 'dia'
  const GROUPS = 'ABCDEFGHIJKL'.split('')

  let shownDays: { key: string; matches: Match[] }[] = []
  let title = ''
  let subtitle = ''

  if (vista === 'fase') {
    const currentRound = all.find((m) => m.status !== 'finished')?.round ?? 8
    const round = Math.min(8, Math.max(1, Number(params.ronda) || currentRound))
    shownDays = groupByDay(all.filter((m) => m.round === round))
    title = ROUND_LABEL[round]
    const mult = round === 8 ? scoring.multipliers['8'] : (scoring?.multipliers?.[String(round)] ?? 1)
    subtitle = `Exacto ${scoring.exact * mult} pts · Solo resultado ${scoring.outcome * mult} pts${round === 8 ? ` · La final vale ${scoring.exact * scoring.final_multiplier}/${scoring.outcome * scoring.final_multiplier}` : ''}`
  } else if (vista === 'grupo') {
    // Grupo K por defecto: ahí juega la Tricolor 🇨🇴
    const grupo = GROUPS.includes(params.grupo ?? '') ? params.grupo! : 'K'
    const ms = all.filter((m) => m.group_name === grupo)
    shownDays = groupByDay(ms)
    const teams = [...new Set(ms.flatMap((m) => [m.home_team, m.away_team]))]
    title = `Grupo ${grupo}`
    subtitle = teams.map((t) => teamLabel(t)).join(' · ')
  } else if (vista === 'semana') {
    const totalWeeks = weekOf(allDays[allDays.length - 1].key, firstDay)
    const currentWeek = Math.min(totalWeeks, Math.max(1, Number(params.semana) || weekOf(defaultDay ?? firstDay, firstDay)))
    shownDays = allDays.filter((d) => weekOf(d.key, firstDay) === currentWeek)
    title = `Semana ${currentWeek} del Mundial`
    subtitle = `${shownDays.reduce((s, d) => s + d.matches.length, 0)} partidos · del ${dayChipLabel(shownDays[0]?.key ?? firstDay)} al ${dayChipLabel(shownDays[shownDays.length - 1]?.key ?? firstDay)}`
  } else {
    const dia = allDays.find((d) => d.key === params.dia)?.key ?? defaultDay
    shownDays = allDays.filter((d) => d.key === dia)
    title = dayLongLabel(dia!)
    subtitle = `${shownDays[0]?.matches.length ?? 0} partido(s) este día`
  }

  // Pendientes por día para los chips (partidos sin iniciar y sin pronóstico)
  const pendingByDay = new Map<string, number>()
  for (const d of allDays) {
    pendingByDay.set(
      d.key,
      d.matches.filter((m) => new Date(m.kickoff_utc).getTime() > now && !myPreds.has(m.id)).length
    )
  }
  const totalWeeks = weekOf(allDays[allDays.length - 1].key, firstDay)
  const activeWeek = vista === 'semana' ? Number(params.semana) || weekOf(defaultDay ?? firstDay, firstDay) : null
  const activeDay = vista === 'dia' ? (allDays.find((d) => d.key === params.dia)?.key ?? defaultDay) : null
  const activeRound = vista === 'fase' ? Math.min(8, Math.max(1, Number(params.ronda) || (all.find((m) => m.status !== 'finished')?.round ?? 8))) : null

  const modeChip = (key: string, label: string) => (
    <Link
      key={key}
      href={`/?vista=${key}`}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
        vista === key ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-600'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <div className="flex-1">
      <Nav session={session} active="fixture" />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Modos de navegación */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {modeChip('dia', '📅 Por día')}
          {modeChip('semana', '🗓️ Por semana')}
          {modeChip('grupo', '🔠 Por grupo')}
          {modeChip('fase', '🏟️ Por fase')}
        </div>

        {/* Navegación secundaria según el modo */}
        {vista === 'dia' && (
          <div className="flex gap-1 overflow-x-auto pb-2 -mx-1 px-1">
            {allDays.map((d) => {
              const pending = pendingByDay.get(d.key) ?? 0
              const isPast = d.key < today
              return (
                <Link
                  key={d.key}
                  href={`/?vista=dia&dia=${d.key}`}
                  className={`shrink-0 flex flex-col items-center rounded-xl border px-2.5 py-1.5 text-xs transition ${
                    d.key === activeDay
                      ? 'border-emerald-400 bg-emerald-950/50 text-emerald-200'
                      : isPast
                        ? 'border-slate-800/60 bg-slate-900/40 text-slate-500 hover:border-slate-600'
                        : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <span className="capitalize font-semibold">{dayChipLabel(d.key)}</span>
                  <span className="text-[10px] text-slate-500 capitalize">{dayMonthLabel(d.key)}</span>
                  {pending > 0 ? (
                    <span className="text-[10px] text-amber-400 font-bold">{pending} ⚠️</span>
                  ) : (
                    <span className="text-[10px] text-emerald-500">✓</span>
                  )}
                </Link>
              )
            })}
          </div>
        )}

        {vista === 'semana' && (
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((w) => (
              <Link
                key={w}
                href={`/?vista=semana&semana=${w}`}
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  w === activeWeek ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-600'
                }`}
              >
                Semana {w}
              </Link>
            ))}
          </div>
        )}

        {vista === 'grupo' && (
          <div className="flex gap-1 overflow-x-auto pb-1">
            {GROUPS.map((g) => {
              const active = (GROUPS.includes(params.grupo ?? '') ? params.grupo : 'K') === g
              return (
                <Link
                  key={g}
                  href={`/?vista=grupo&grupo=${g}`}
                  className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold transition ${
                    active ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-600'
                  }`}
                >
                  {g === 'K' ? '🇨🇴' : g}
                </Link>
              )
            })}
          </div>
        )}

        {vista === 'fase' && (
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {Object.entries(ROUND_CHIP).map(([r, label]) => (
              <Link
                key={r}
                href={`/?vista=fase&ronda=${r}`}
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  Number(r) === activeRound ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-600'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Encabezado + enlace FIFA */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold capitalize">{title}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          </div>
          <a
            href={FIFA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-xs rounded-lg border border-slate-700 px-2.5 py-1.5 text-slate-300 hover:border-emerald-500 hover:text-emerald-300 transition"
          >
            📊 Estadísticas FIFA ↗
          </a>
        </div>

        {/* Partidos agrupados por día */}
        {shownDays.map((d) => (
          <section key={d.key}>
            {(vista !== 'dia' || shownDays.length > 1) && (
              <h2 className="text-sm font-semibold text-emerald-400/90 capitalize mb-2">{dayLongLabel(d.key)}</h2>
            )}
            <div className="space-y-2">
              {d.matches.map((m) => {
                const pred = myPreds.get(m.id)
                return (
                  <div key={m.id} className="relative">
                    <span className="absolute -top-1.5 right-2 text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded z-[1]">
                      {m.group_name ? `Grupo ${m.group_name}` : ROUND_LABEL[m.round]}
                    </span>
                    <MatchCard
                      matchId={m.id}
                      home={m.home_team}
                      away={m.away_team}
                      kickoffLabel={formatKickoff(m.kickoff_utc)}
                      venue={m.venue}
                      tv={tvColombia(m)}
                      locked={new Date(m.kickoff_utc).getTime() <= now}
                      status={m.status}
                      actualHome={m.home_score}
                      actualAway={m.away_score}
                      initialHome={pred?.home_score ?? null}
                      initialAway={pred?.away_score ?? null}
                      points={pred?.points ?? null}
                      maxExact={(scoring?.exact ?? 5) * (m.id === 104 ? scoring.final_multiplier : (scoring?.multipliers?.[String(m.round)] ?? 1))}
                    />
                  </div>
                )
              })}
            </div>
          </section>
        ))}

        {/* Info de transmisión */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-xs text-slate-400">
          📺 <strong className="text-slate-300">¿Dónde ver los partidos en Colombia?</strong> DSports (DGO) y Paramount+
          transmiten los 104 partidos · Caracol y RCN pasan 35 en señal abierta (incluida toda la Tricolor 🇨🇴) ·
          Disney+ Premium tiene 30 · Resultados, estadísticas y alineaciones oficiales en{' '}
          <a href={FIFA_URL} target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline">FIFA.com</a>.
        </div>
      </main>
    </div>
  )
}
