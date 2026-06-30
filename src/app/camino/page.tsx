import Link from 'next/link'
import { redirect } from 'next/navigation'
import Nav from '@/components/Nav'
import AutoRefresh from '@/components/AutoRefresh'
import { adminDb, type Match } from '@/lib/db'
import { getSession } from '@/lib/session'
import { syncResults } from '@/lib/sync'
import { teamFlag, teamShort, isPlaceholder } from '@/lib/teams'
import { stadiumOf } from '@/lib/stadiums'
import { BRACKET_COLUMNS, ROUND_SHORT } from '@/lib/bracket'

const THIRD_ID = 103

export const dynamic = 'force-dynamic'

const isTBD = (t: string | null | undefined) => !t || t === 'To be announced' || isPlaceholder(t)

function Slot({ team, score, isWin, show }: { team: string | null; score: number | null; isWin: boolean; show: boolean }) {
  const tbd = isTBD(team)
  const col = team === 'Colombia'
  return (
    <div className={`bkr-slot${isWin ? ' win' : ''}${col ? ' col' : ''}${tbd ? ' tbd' : ''}`}>
      <span className="fl">{tbd ? '⚪' : teamFlag(team!)}</span>
      <span className="nm">{tbd ? 'Por definir' : teamShort(team!)}</span>
      {show && !tbd && <span className="sc">{score ?? 0}</span>}
      {isWin && <span className="chk">✓</span>}
    </div>
  )
}

function MatchCard({ m }: { m: Match | undefined }) {
  if (!m) return <div className="bkr-match bkr-empty" />
  const show = m.status !== 'scheduled'
  const d = new Date(m.kickoff_utc)
  const fecha = d.toLocaleDateString('es-CO', { timeZone: 'America/Bogota', weekday: 'short', day: 'numeric', month: 'short' })
  const hora = d.toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: 'numeric', minute: '2-digit' })
  const when =
    m.status === 'live' ? `🔴 EN VIVO${m.minute ? ` ${m.minute}` : ''}` :
    m.status === 'finished' ? '✅ Final' :
    `${fecha} · 🕐 ${hora}`
  const st = stadiumOf(m.venue)
  return (
    <div className={`bkr-match${m.status === 'live' ? ' is-live' : ''}`}>
      <div className={`bkr-when${m.status === 'live' ? ' liv' : ''}`}>{when}</div>
      <Slot team={m.home_team} score={m.home_score} show={show} isWin={m.status === 'finished' && m.winner === m.home_team} />
      <Slot team={m.away_team} score={m.away_score} show={show} isWin={m.status === 'finished' && m.winner === m.away_team} />
      <div className="bkr-venue">
        {st ? <><span className="ve-st">🏟️ {st.nombre}</span><span className="ve-ci">📍 {st.ciudad}</span></> : <span className="ve-ci">{m.venue ?? ''}</span>}
      </div>
    </div>
  )
}

export default async function CaminoPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  await syncResults().catch(() => {})

  const db = adminDb()
  const { data: matches } = await db.from('matches').select('*').gte('round', 4).order('id')
  const all = (matches ?? []) as Match[]
  const byId = new Map(all.map((m) => [m.id, m]))
  const live = all.some((m) => m.status === 'live')

  const final = byId.get(104)
  const third = byId.get(THIRD_ID)
  const champion = final?.status === 'finished' ? final.winner : null

  // Selecciones con vida: arrancan 32 en 16vos y cada partido jugado elimina una.
  const playedKO = all.filter((m) => m.round >= 4 && m.round <= 8 && m.id !== THIRD_ID && m.status === 'finished').length
  const aliveCount = Math.max(2, 32 - playedKO)

  return (
    <div className="shell">
      {live && <AutoRefresh seconds={20} />}
      <div className="shell-content fade">
        <div className="appbar">
          <div>
            <div className="kicker" style={{ color: live ? 'var(--red)' : 'var(--green)' }}>
              {live ? '🔴 hay partido en vivo' : '🏆 fase de eliminación'}
            </div>
            <h2 className="display">Camino a la final</h2>
          </div>
          <span className="pill" style={{ background: 'var(--yellow)' }}>19 jul · MetLife</span>
        </div>

        {champion ? (
          <div className="card mx-[14px] text-center" style={{ background: 'var(--yellow)' }}>
            <p className="text-3xl">🏆👑</p>
            <p className="display text-2xl uppercase">{teamFlag(champion)} {teamShort(champion)}</p>
            <p className="text-xs font-extrabold">¡CAMPEÓN DEL MUNDO 2026!</p>
          </div>
        ) : (
          <p className="px-[18px] text-[12px] font-bold" style={{ color: 'var(--muted)' }}>
            El cuadro se llena solito con el <b>fixture real</b>: cada vez que una selección avanza, aparece en la siguiente llave.
            Quedan <b style={{ color: 'var(--ink)' }}>{aliveCount}</b> selecciones con vida. 🕐 <b>Todas las horas son de Colombia</b>, ¡pa’ que no se pierdan ni un partido! 👉 deslízate para ver toda la ruta.
          </p>
        )}

        <div className="bracket-wrap">
          <div className="bracket">
            {BRACKET_COLUMNS.map((col) => (
              <div key={col.round} className={`bkr-col${col.round === 8 ? ' bkr-final' : ''}`}>
                <div className="bkr-col-title">{col.round === 8 ? '🏆 Final' : ROUND_SHORT[col.round]}</div>
                {col.round === 8 ? (
                  <div className="bkr-final-wrap">
                    <div className="bkr-trophy">🏆</div>
                    <MatchCard m={final} />
                    <div className="bkr-third-tag">🥉 3er puesto</div>
                    <MatchCard m={third} />
                  </div>
                ) : (
                  col.ids.map((id) => <MatchCard key={id} m={byId.get(id)} />)
                )}
              </div>
            ))}
          </div>
        </div>

        <p className="px-[18px] pt-3 text-[11px] font-bold" style={{ color: 'var(--muted)' }}>
          🥈 Recuerda: en esta fase cada acierto vale más (16vos ×2 … final ×6) y suma <b>+2</b> si aciertas el nº de goles del ganador.
          {' '}<Link href="/simulador" style={{ color: 'var(--green)', textDecoration: 'underline' }}>Ver cómo quedó la fase de grupos →</Link>
        </p>
        <div className="spacer" />
      </div>
      <Nav session={session} active="camino" />
    </div>
  )
}
