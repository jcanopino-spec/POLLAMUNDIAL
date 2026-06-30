import Link from 'next/link'
import { redirect } from 'next/navigation'
import Nav from '@/components/Nav'
import AutoRefresh from '@/components/AutoRefresh'
import { adminDb, type Match } from '@/lib/db'
import { getSession } from '@/lib/session'
import { syncResults } from '@/lib/sync'
import { teamFlag, teamShort, isPlaceholder } from '@/lib/teams'
import { stadiumOf } from '@/lib/stadiums'
import { KO } from '@/lib/bracket'

export const dynamic = 'force-dynamic'

const THIRD_ID = 103
const isTBD = (t: string | null | undefined) => !t || t === 'To be announced' || isPlaceholder(t)

// ---- Geometría del bracket (dos lados que confluyen en la final) ----
const ROW_H = 100, COL_W = 172, CARD_W = 156, CARD_H = 88, TOP = 30
// Columnas de izquierda→derecha (índice 0..8). El centro (4) es la final.
const COLS: number[][] = [
  [74, 77, 73, 75, 83, 84, 81, 82], // 0 · 16vos izq
  [89, 90, 93, 94],                 // 1 · 8vos izq
  [97, 98],                         // 2 · 4tos izq
  [101],                            // 3 · semi izq
  [104],                            // 4 · FINAL
  [102],                            // 5 · semi der
  [99, 100],                        // 6 · 4tos der
  [91, 92, 95, 96],                 // 7 · 8vos der
  [76, 78, 79, 80, 86, 88, 85, 87], // 8 · 16vos der
]
const LEFT16 = COLS[0], RIGHT16 = COLS[8]
const colOf: Record<number, number> = {}
COLS.forEach((ids, ci) => ids.forEach((id) => (colOf[id] = ci)))
const COL_TITLE = ['16vos', '8vos', '4tos', 'Semis', '🏆 Final', 'Semis', '4tos', '8vos', '16vos']

// Centro vertical de cada partido: las hojas (16vos) por su fila; el resto, promedio de sus dos padres.
function yc(id: number): number {
  const li = LEFT16.indexOf(id); if (li >= 0) return (li + 0.5) * ROW_H
  const ri = RIGHT16.indexOf(id); if (ri >= 0) return (ri + 0.5) * ROW_H
  const [a, b] = KO[id]; return (yc(a) + yc(b)) / 2
}
const EDGE_CHILDREN = [89, 90, 93, 94, 97, 98, 101, 91, 92, 95, 96, 99, 100, 102, 104]
const SIDE_H = 8 * ROW_H
const CANVAS_W = 9 * COL_W - (COL_W - CARD_W)
const CANVAS_H = TOP + SIDE_H + CARD_H + 30

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

function BracketCard({ m, x, y, isFinal }: { m: Match | undefined; x: number; y: number; isFinal?: boolean }) {
  const style = { left: x, top: y, width: CARD_W, height: CARD_H }
  if (!m) return <div className="bkr-node bkr-empty" style={style} />
  const show = m.status !== 'scheduled'
  const d = new Date(m.kickoff_utc)
  const fecha = d.toLocaleDateString('es-CO', { timeZone: 'America/Bogota', weekday: 'short', day: 'numeric', month: 'short' })
  const hora = d.toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: 'numeric', minute: '2-digit' })
  const when = m.status === 'live' ? `🔴 EN VIVO${m.minute ? ` ${m.minute}` : ''}` : m.status === 'finished' ? '✅ Final' : `${fecha} · 🕐 ${hora}`
  const st = stadiumOf(m.venue)
  return (
    <div className={`bkr-node${m.status === 'live' ? ' is-live' : ''}${isFinal ? ' is-final' : ''}`} style={style}>
      <div className={`bkr-when${m.status === 'live' ? ' liv' : ''}`}>{when}</div>
      <Slot team={m.home_team} score={m.home_score} show={show} isWin={m.status === 'finished' && m.winner === m.home_team} />
      <Slot team={m.away_team} score={m.away_score} show={show} isWin={m.status === 'finished' && m.winner === m.away_team} />
      <div className="bkr-venue">{st ? `🏟️ ${st.nombre} · ${st.ciudad}` : (m.venue ?? '')}</div>
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
  const playedKO = all.filter((m) => m.round >= 4 && m.round <= 8 && m.id !== THIRD_ID && m.status === 'finished').length
  const aliveCount = Math.max(2, 32 - playedKO)

  // Aristas (camino) padre→hijo con su trazado en codo y flecha hacia el hijo (rumbo a la final).
  const edges = EDGE_CHILDREN.flatMap((child) =>
    KO[child].map((parent) => {
      const pc = colOf[parent], cc = colOf[child]
      const py = TOP + yc(parent), cy = TOP + yc(child)
      const leftToRight = pc < cc
      const x1 = leftToRight ? pc * COL_W + CARD_W : pc * COL_W
      const x2 = leftToRight ? cc * COL_W : cc * COL_W + CARD_W
      const mx = (x1 + x2) / 2
      const live2 = byId.get(parent)?.status === 'finished'
      return { d: `M ${x1} ${py} H ${mx} V ${cy} H ${x2}`, done: live2, key: `${parent}-${child}` }
    })
  )

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
            Las flechas marcan el <b>camino a la final</b> 🏆. El cuadro se llena solo con el <b>fixture real</b> cada vez que avanza una selección.
            Quedan <b style={{ color: 'var(--ink)' }}>{aliveCount}</b> con vida. 🕐 horas de Colombia · 👉 desliza ←→ para ver todo.
          </p>
        )}

        <div className="bracket-wrap">
          <div className="bracket-canvas" style={{ width: CANVAS_W, height: CANVAS_H }}>
            <svg className="bkr-lines" width={CANVAS_W} height={CANVAS_H} viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}>
              <defs>
                <marker id="arr" markerWidth="8" markerHeight="8" refX="5.5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="var(--ink)" />
                </marker>
                <marker id="arrG" markerWidth="8" markerHeight="8" refX="5.5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="var(--green)" />
                </marker>
              </defs>
              {edges.map((e) => (
                <path key={e.key} d={e.d} fill="none" markerEnd={`url(#${e.done ? 'arrG' : 'arr'})`}
                  stroke={e.done ? 'var(--green)' : '#b8ab8d'} strokeWidth={e.done ? 2.6 : 2} strokeDasharray={e.done ? undefined : '5 4'} />
              ))}
            </svg>

            {/* títulos de columna */}
            {COLS.map((_, ci) => (
              <div key={`t${ci}`} className={`bkr-coltitle${ci === 4 ? ' fin' : ''}`} style={{ left: ci * COL_W, width: CARD_W, top: 2 }}>
                {COL_TITLE[ci]}
              </div>
            ))}

            {/* trofeo sobre la final */}
            <div className="bkr-trophy" style={{ left: 4 * COL_W, width: CARD_W, top: TOP + yc(104) - CARD_H / 2 - 34 }}>🏆</div>

            {/* tarjetas de todos los partidos */}
            {COLS.flat().map((id) => (
              <BracketCard key={id} m={byId.get(id)} x={colOf[id] * COL_W} y={TOP + yc(id) - CARD_H / 2} isFinal={id === 104} />
            ))}

            {/* tercer puesto, debajo de la final */}
            <div className="bkr-thirdlbl" style={{ left: 4 * COL_W, width: CARD_W, top: TOP + SIDE_H - 6 }}>🥉 Tercer puesto</div>
            <BracketCard m={third} x={4 * COL_W} y={TOP + SIDE_H + 14} />
          </div>
        </div>

        <p className="px-[18px] pt-3 text-[11px] font-bold" style={{ color: 'var(--muted)' }}>
          🟢 línea verde = camino ya recorrido (partido jugado) · ⚪ punteada = aún por definir. 🥈 En esta fase suma <b>+2</b> si aciertas el nº de goles del ganador.
          {' '}<Link href="/simulador" style={{ color: 'var(--green)', textDecoration: 'underline' }}>Ver fase de grupos →</Link>
        </p>
        <div className="spacer" />
      </div>
      <Nav session={session} active="camino" />
    </div>
  )
}
