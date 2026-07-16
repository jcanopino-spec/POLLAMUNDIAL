import { redirect } from 'next/navigation'
import Nav from '@/components/Nav'
import NecoEditor from '@/components/NecoEditor'
import { adminDb, type Match } from '@/lib/db'
import { getSession } from '@/lib/session'
import { syncResults } from '@/lib/sync'
import { rosterFor } from '@/lib/rosters'
import { teamFlag, teamShort } from '@/lib/teams'
import {
  DEFAULT_NECO_SCORING, NECO_EXCLUDED_HOUSE, NECO_MATCH_IDS,
  PHASE_LABEL, scoreNeco, type GoalPhase, type NecoPrediction, type NecoScoring,
} from '@/lib/neco'

export const dynamic = 'force-dynamic'

function kickoffLabel(utc: string) {
  const d = new Date(utc)
  const fecha = d.toLocaleDateString('es-CO', { timeZone: 'America/Bogota', weekday: 'short', day: 'numeric', month: 'short' })
  const hora = d.toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: 'numeric', minute: '2-digit' })
  return `${fecha} · 🕐 ${hora}`
}

export default async function NecoPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  await syncResults().catch(() => {})

  const db = adminDb()
  const [{ data: me }, { data: matchesRaw }, { data: scoringRow }, { data: actualRow }, predsRes, { data: participants }] =
    await Promise.all([
      db.from('participants').select('house_number, is_admin').eq('id', session.id).single(),
      db.from('matches').select('*').in('id', NECO_MATCH_IDS as unknown as number[]).order('id'),
      db.from('settings').select('value').eq('key', 'neco_scoring').maybeSingle(),
      db.from('settings').select('value').eq('key', 'neco_actual').maybeSingle(),
      db.from('neco_predictions').select('*'),
      db.from('participants').select('house_number, is_admin, name'),
    ])

  const notInitialized = !!predsRes.error // tabla aún no creada (migración sin aplicar)
  const scoring = (scoringRow?.value as NecoScoring) ?? DEFAULT_NECO_SCORING
  const actualCorners = (actualRow?.value ?? {}) as Record<string, { corners?: number }>
  const preds = (predsRes.data ?? []) as NecoPrediction[]
  const matches = (matchesRaw ?? []) as Match[]
  const byId = new Map(matches.map((m) => [m.id, m]))

  const myHouse = me?.house_number?.trim() || null
  const isGuest = myHouse === NECO_EXCLUDED_HOUSE
  const canPlay = !!myHouse && !isGuest

  // Casas participantes (todas menos 2026 e invitados/admin sin casa)
  const houses = [...new Set(
    (participants ?? [])
      .filter((p) => !p.is_admin && p.house_number && p.house_number.trim() && p.house_number.trim() !== NECO_EXCLUDED_HOUSE)
      .map((p) => p.house_number!.trim())
  )].sort()

  const predOf = (house: string, matchId: number) => preds.find((p) => p.house_number === house && p.match_id === matchId) ?? null

  // Tabla acumulada por casa (suma de los partidos ya jugados)
  const table = houses.map((h) => {
    let total = 0
    const perMatch: Record<number, number> = {}
    for (const mid of NECO_MATCH_IDS) {
      const m = byId.get(mid); const pr = predOf(h, mid)
      const pts = m && pr ? scoreNeco(pr, m, scoring, actualCorners[String(mid)]?.corners ?? null).total : 0
      perMatch[mid] = pts; total += pts
    }
    return { house: h, total, perMatch, done: NECO_MATCH_IDS.filter((mid) => predOf(h, mid)).length }
  }).sort((a, b) => b.total - a.total || a.house.localeCompare(b.house))

  const anyFinished = matches.some((m) => m.status === 'finished')

  return (
    <div className="shell">
      <div className="shell-content fade">
        <div className="appbar">
          <div>
            <div className="kicker" style={{ color: 'var(--green)' }}>🎪 evento especial · por casa</div>
            <h2 className="display">NECO</h2>
          </div>
          <span className="pill" style={{ background: 'var(--yellow)' }}>2 partidos finales</span>
        </div>

        <p className="px-[18px] text-[12px] font-bold" style={{ color: 'var(--muted)' }}>
          El <b>NECO</b> es un evento aparte de la app: los puntos se manejan <b>por casa</b> (no por jugador) y se
          <b> acumulan</b> en los 2 partidos finales. Cualquier integrante de la casa puede llenar o editar el pronóstico
          con su clave, y <b>cierra al pitazo</b>. 🏠 La <b>Casa {NECO_EXCLUDED_HOUSE}</b> (invitados) puede mirar pero no participa.
        </p>

        {notInitialized && (
          <div className="card mx-[14px] mt-3" style={{ background: '#ffe8e8', border: '2px solid var(--red)' }}>
            <p className="font-extrabold" style={{ color: 'var(--red)' }}>⚙️ Falta inicializar el NECO</p>
            <p className="text-[12px] font-bold">Aplica <code>supabase/neco.sql</code> en el editor SQL de Supabase para crear la tabla y el puntaje. Luego recarga.</p>
          </div>
        )}

        {/* Reglas de puntaje */}
        <div className="mx-[14px] mt-3 rounded-2xl p-3" style={{ border: '3px solid var(--ink)', background: 'var(--card, #fffdf7)' }}>
          <p className="display text-sm uppercase mb-1">🎯 Cómo suma cada casa (por partido)</p>
          <ul className="text-[12px] font-bold leading-6" style={{ color: 'var(--ink)' }}>
            <li>🏆 Acertar el ganador — <b>+{scoring.winner}</b></li>
            <li>🔢 Acertar el nº de goles del ganador — <b>+{scoring.winner_goals}</b></li>
            <li>⚽ Cada autor de gol acertado — <b>+{scoring.scorer}</b></li>
            <li>🚩 Acertar los tiros de esquina totales — <b>+{scoring.corners}</b></li>
            <li>⏱️ Acertar la etapa de los goles — <b>+{scoring.goal_phase}</b></li>
            <li>🥅 Predecir tanda de penaltis (si la hay) — <b>+{scoring.penalties}</b></li>
          </ul>
        </div>

        {/* Estado del jugador */}
        {!canPlay && (
          <div className="card mx-[14px] mt-3" style={{ background: '#eef4ff', border: '2px solid var(--blue)' }}>
            <p className="font-extrabold" style={{ color: 'var(--blue)' }}>
              {isGuest ? '🏠 Eres de la Casa 2026 (invitados)' : '👀 Modo espectador'}
            </p>
            <p className="text-[12px] font-bold">Puedes ver el NECO y la tabla, pero esta casa no participa del evento.</p>
          </div>
        )}

        {/* Partidos */}
        {NECO_MATCH_IDS.map((mid) => {
          const m = byId.get(mid)
          if (!m) return null
          const locked = new Date(m.kickoff_utc).getTime() <= Date.now() || m.status !== 'scheduled'
          const mine = myHouse ? predOf(myHouse, mid) : null
          const label = mid === 103 ? '🥉 Tercer puesto' : '🏆 GRAN FINAL'
          return (
            <div key={mid} className="match mx-[14px] mt-3" style={{ border: '3px solid var(--ink)', borderRadius: 16, padding: 14 }}>
              <div className="mtop" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                <span className="grp">{label}</span>
                <span>{m.status === 'finished' ? '✅ Final' : locked ? '🔒 Cerrado' : kickoffLabel(m.kickoff_utc)}</span>
              </div>
              <div className="mbody" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '10px 0' }}>
                <span style={{ fontWeight: 900, fontSize: 18 }}>{teamFlag(m.home_team)} {teamShort(m.home_team)}</span>
                <span style={{ color: 'var(--muted)', fontWeight: 800 }}>vs</span>
                <span style={{ fontWeight: 900, fontSize: 18 }}>{teamShort(m.away_team)} {teamFlag(m.away_team)}</span>
              </div>

              {/* Pronóstico actual de mi casa */}
              {mine && (
                <div className="rounded-xl p-2 mb-2 text-[12px] font-bold" style={{ background: '#f0ece0' }}>
                  🏠 <b>Casa {myHouse}</b> ya pronosticó: ganador <b>{mine.winner ? teamShort(mine.winner) : '—'}</b> con <b>{mine.winner_goals ?? '—'}</b> gol(es)
                  {mine.scorers?.length ? <> · goleadores: {mine.scorers.join(', ')}</> : null}
                  {mine.corners_total != null ? <> · córners {mine.corners_total}</> : null}
                  {mine.goal_phase ? <> · {PHASE_LABEL[mine.goal_phase as GoalPhase]}</> : null}
                  {mine.penalties ? <> · 🥅 con penaltis</> : null}
                </div>
              )}

              {canPlay && !locked ? (
                <NecoEditor
                  matchId={mid}
                  homeTeam={m.home_team}
                  awayTeam={m.away_team}
                  homeRoster={rosterFor(m.home_team)}
                  awayRoster={rosterFor(m.away_team)}
                  scoring={scoring}
                  initial={mine ? {
                    winner: mine.winner, winnerGoals: mine.winner_goals, scorers: mine.scorers ?? [],
                    cornersTotal: mine.corners_total, goalPhase: mine.goal_phase as GoalPhase | null, penalties: mine.penalties,
                  } : null}
                />
              ) : (
                <p className="text-[12px] font-bold" style={{ color: 'var(--muted)' }}>
                  {locked ? '🔒 Pronóstico cerrado (ya inició o terminó).' : '👀 Solo lectura.'}
                </p>
              )}
            </div>
          )
        })}

        {/* Tabla NECO por casa */}
        <div className="subhead mt-4">🏆 Tabla NECO (acumulada por casa)</div>
        <div className="rk-list">
          {table.map((r, i) => (
            <div key={r.house} className={`row${i === 0 && anyFinished ? ' lead' : ''}${myHouse === r.house ? ' me' : ''}`}>
              <div className="pos">{i + 1}</div>
              <div className="av" style={{ fontSize: 20 }}>🏠</div>
              <div className="nm">
                <b>Casa {r.house}{myHouse === r.house ? <span style={{ color: 'var(--blue)' }}> · la tuya</span> : null}</b>
                <small>{r.done}/{NECO_MATCH_IDS.length} pronóstico(s) cargado(s)</small>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="pts">{r.total}<small>PTS</small></div>
              </div>
            </div>
          ))}
        </div>
        {!anyFinished && (
          <p className="px-[18px] pt-2 text-[11px] font-bold" style={{ color: 'var(--muted)' }}>
            La tabla arranca en 0: los puntos se cargan cuando terminen los partidos. ¡Carguen su pronóstico antes del pitazo! 🐷
          </p>
        )}
        <div className="spacer" />
      </div>
      <Nav session={session} active="neco" />
    </div>
  )
}
