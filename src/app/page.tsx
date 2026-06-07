import Link from 'next/link'
import { redirect } from 'next/navigation'
import Nav from '@/components/Nav'
import MatchCard from '@/components/MatchCard'
import { adminDb, type Match } from '@/lib/db'
import { getSession } from '@/lib/session'
import { ROUND_LABEL, type Scoring } from '@/lib/scoring'
import { formatKickoff, teamFlag, teamShort } from '@/lib/teams'
import { syncResults } from '@/lib/sync'
import { Countdown } from '@/components/Fiesta'
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
    const mult = scoring?.multipliers?.[String(round)] ?? 1
    subtitle = `Exacto ${scoring.exact * mult} pts · resultado ${scoring.outcome * mult} pts${round === 8 ? ` · la final va ${scoring.exact * scoring.final_multiplier}/${scoring.outcome * scoring.final_multiplier}` : ''}`
  } else if (vista === 'grupo') {
    const grupo = GROUPS.includes(params.grupo ?? '') ? params.grupo! : 'K'
    const ms = all.filter((m) => m.group_name === grupo)
    shownDays = groupByDay(ms)
    const teams = [...new Set(ms.flatMap((m) => [m.home_team, m.away_team]))]
    title = `Grupo ${grupo}`
    subtitle = teams.map((t) => `${teamFlag(t)} ${teamShort(t)}`).join(' · ')
  } else if (vista === 'semana') {
    const totalWeeks = weekOf(allDays[allDays.length - 1].key, firstDay)
    const currentWeek = Math.min(totalWeeks, Math.max(1, Number(params.semana) || weekOf(defaultDay ?? firstDay, firstDay)))
    shownDays = allDays.filter((d) => weekOf(d.key, firstDay) === currentWeek)
    title = `Semana ${currentWeek}`
    subtitle = `${shownDays.reduce((s, d) => s + d.matches.length, 0)} partidos · del ${dayChipLabel(shownDays[0]?.key ?? firstDay)} al ${dayChipLabel(shownDays[shownDays.length - 1]?.key ?? firstDay)}`
  } else {
    const dia = allDays.find((d) => d.key === params.dia)?.key ?? defaultDay
    shownDays = allDays.filter((d) => d.key === dia)
    title = dayLongLabel(dia!)
    subtitle = `${shownDays[0]?.matches.length ?? 0} partido(s) este día`
  }

  const pendingByDay = new Map<string, number>()
  let totalPending = 0
  for (const d of allDays) {
    const n = d.matches.filter((m) => new Date(m.kickoff_utc).getTime() > now && !myPreds.has(m.id)).length
    pendingByDay.set(d.key, n)
    totalPending += n
  }
  const totalWeeks = weekOf(allDays[allDays.length - 1].key, firstDay)
  const activeWeek = vista === 'semana' ? Math.min(totalWeeks, Math.max(1, Number(params.semana) || weekOf(defaultDay ?? firstDay, firstDay))) : null
  const activeDay = vista === 'dia' ? (allDays.find((d) => d.key === params.dia)?.key ?? defaultDay) : null
  const activeRound = vista === 'fase' ? Math.min(8, Math.max(1, Number(params.ronda) || (all.find((m) => m.status !== 'finished')?.round ?? 8))) : null
  const activeGroup = vista === 'grupo' ? (GROUPS.includes(params.grupo ?? '') ? params.grupo! : 'K') : null

  // Héroe: próximo partido (prioridad a la Tricolor si juega hoy)
  const nextMatch = all.find((m) => new Date(m.kickoff_utc).getTime() > now)
  const liveCount = all.filter((m) => m.status === 'live').length
  const colombiaToday = all.find(
    (m) => dayKey(m.kickoff_utc) === today && (m.home_team === 'Colombia' || m.away_team === 'Colombia')
  )
  const heroMatch = colombiaToday ?? nextMatch

  return (
    <div className="shell">
      <div className="shell-content fade">
        <div className="appbar">
          <div>
            <div className="kicker">🎯 Tus apuestas{liveCount > 0 && <span style={{ color: 'var(--red)' }}> · {liveCount} en juego</span>}</div>
            <h2 className="display">Pronosticar</h2>
          </div>
          {totalPending > 0 && (
            <span className="pill" style={{ background: 'var(--red)', color: '#fff' }}>⏰ Faltan {totalPending}</span>
          )}
        </div>

        {/* Héroe próximo partido */}
        {heroMatch && (
          <div className="hero">
            <div className="hp">
              <div className="tag">
                {colombiaToday ? '🇨🇴 ¡HOY JUEGA LA TRICOLOR!' : heroMatch.group_name ? `Grupo ${heroMatch.group_name}` : ROUND_LABEL[heroMatch.round]} · {heroMatch.venue}
              </div>
              <div className="vs">
                <div className="team"><div className="fl">{teamFlag(heroMatch.home_team)}</div><div className="nm">{teamShort(heroMatch.home_team)}</div></div>
                <div className="mid">
                  <div className="x">VS</div>
                  <div className="when">{formatKickoff(heroMatch.kickoff_utc)} (Col)</div>
                </div>
                <div className="team"><div className="fl">{teamFlag(heroMatch.away_team)}</div><div className="nm">{teamShort(heroMatch.away_team)}</div></div>
              </div>
              <div className="flex justify-center pb-1">
                <Countdown
                  targetIso={new Date(heroMatch.kickoff_utc).toISOString()}
                  label={tournamentStarted ? 'Falta pa’l pitazo' : '¡Arranca el Mundial en…!'}
                />
              </div>
            </div>
          </div>
        )}

        {/* Modos de vista */}
        <div className="seg" style={{ marginTop: 16 }}>
          <Link className={vista === 'dia' ? 'on' : ''} href="/?vista=dia">📅 Día</Link>
          <Link className={vista === 'semana' ? 'on' : ''} href="/?vista=semana">🗓️ Semana</Link>
          <Link className={vista === 'grupo' ? 'on' : ''} href="/?vista=grupo">🔠 Grupo</Link>
          <Link className={vista === 'fase' ? 'on' : ''} href="/?vista=fase">🏟️ Fase</Link>
        </div>

        {/* Navegación secundaria */}
        {vista === 'dia' && (
          <div className="chips">
            {allDays.map((d) => {
              const pending = pendingByDay.get(d.key) ?? 0
              const juegaColombia = d.matches.some((m) => m.home_team === 'Colombia' || m.away_team === 'Colombia')
              return (
                <Link key={d.key} href={`/?vista=dia&dia=${d.key}`} className={`chip ${d.key === activeDay ? 'on' : ''} ${pending > 0 ? 'warn' : ''}`}>
                  {juegaColombia && '🇨🇴'}
                  <span className="capitalize">{dayChipLabel(d.key)} {dayMonthLabel(d.key)}</span>
                  {pending > 0 ? <b style={{ color: d.key === activeDay ? 'var(--yellow)' : 'var(--red)' }}>·{pending}</b> : '✓'}
                </Link>
              )
            })}
          </div>
        )}

        {vista === 'semana' && (
          <div className="chips">
            {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((w) => (
              <Link key={w} href={`/?vista=semana&semana=${w}`} className={`chip ${w === activeWeek ? 'on' : ''}`}>Semana {w}</Link>
            ))}
          </div>
        )}

        {vista === 'grupo' && (
          <div className="chips">
            {GROUPS.map((g) => (
              <Link key={g} href={`/?vista=grupo&grupo=${g}`} className={`chip ${g === activeGroup ? 'on' : ''}`}>
                {g === 'K' ? '🇨🇴 K' : g}
              </Link>
            ))}
          </div>
        )}

        {vista === 'fase' && (
          <div className="chips">
            {Object.entries(ROUND_CHIP).map(([r, label]) => (
              <Link key={r} href={`/?vista=fase&ronda=${r}`} className={`chip ${Number(r) === activeRound ? 'on' : ''}`}>{label}</Link>
            ))}
          </div>
        )}

        {/* Título de la selección */}
        <div className="flex items-start justify-between gap-2 px-[18px] pb-3">
          <div>
            <h1 className="display text-xl uppercase capitalize">{title}</h1>
            <p className="text-[11px] font-bold" style={{ color: 'var(--muted)' }}>{subtitle}</p>
          </div>
          <a href={FIFA_URL} target="_blank" rel="noopener noreferrer" className="pill shrink-0" style={{ background: 'var(--paper)' }}>
            📊 FIFA ↗
          </a>
        </div>

        {/* Partidos */}
        {shownDays.map((d) => (
          <section key={d.key}>
            {(vista !== 'dia' || shownDays.length > 1) && (
              <p className="kicker capitalize px-[18px] pb-2" style={{ color: 'var(--green)' }}>{dayLongLabel(d.key)}</p>
            )}
            {d.matches.map((m) => {
              const pred = myPreds.get(m.id)
              return (
                <MatchCard
                  key={m.id}
                  matchId={m.id}
                  home={m.home_team}
                  away={m.away_team}
                  kickoffLabel={formatKickoff(m.kickoff_utc)}
                  venue={m.venue}
                  tv={tvColombia(m)}
                  groupLabel={m.group_name ? `Grupo ${m.group_name} · P${m.id}` : `${ROUND_LABEL[m.round]} · P${m.id}`}
                  locked={new Date(m.kickoff_utc).getTime() <= now}
                  status={m.status}
                  actualHome={m.home_score}
                  actualAway={m.away_score}
                  initialHome={pred?.home_score ?? null}
                  initialAway={pred?.away_score ?? null}
                  points={pred?.points ?? null}
                  maxExact={(scoring?.exact ?? 5) * (m.id === 104 ? scoring.final_multiplier : (scoring?.multipliers?.[String(m.round)] ?? 1))}
                />
              )
            })}
          </section>
        ))}

        {/* Transmisión */}
        <div className="castigo">
          <div className="big">📺</div>
          <div className="t">
            <b>¿Dónde verlos?</b> DSports (DGO) y Paramount+ pasan los 104 · Caracol y RCN dan 35 en abierta
            (incluida toda la Tricolor 🇨🇴) · Estadísticas oficiales en{' '}
            <a href={FIFA_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--yellow)', textDecoration: 'underline' }}>FIFA.com</a>
          </div>
        </div>
        <div className="spacer" />
      </div>
      <Nav session={session} active="fixture" />
    </div>
  )
}
