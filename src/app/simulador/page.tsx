import Link from 'next/link'
import { redirect } from 'next/navigation'
import Nav from '@/components/Nav'
import { adminDb, type Match } from '@/lib/db'
import { getSession } from '@/lib/session'
import { groupTable, topScorers } from '@/lib/groups'
import { teamFlag, teamShort } from '@/lib/teams'
import { syncResults } from '@/lib/sync'

export const dynamic = 'force-dynamic'

const GROUPS = 'ABCDEFGHIJKL'.split('')

// Frase con humor según la posición en el grupo
const note = (i: number, total: number, pj: number): string => {
  if (pj === 0) return 'sin jugar aún'
  if (i === 0) return '👑 puntero del grupo'
  if (i === 1) return '✅ clasificando'
  if (i === 2) return '😬 sufriendo el repechaje'
  return '🐷 con un pie en el avión'
}

export default async function GruposPage({ searchParams }: { searchParams: Promise<{ g?: string }> }) {
  const session = await getSession()
  if (!session) redirect('/login')
  await syncResults().catch(() => {})

  const db = adminDb()
  const [{ data: matches }, { data: allMatches }] = await Promise.all([
    db.from('matches').select('*').not('group_name', 'is', null).order('kickoff_utc'),
    db.from('matches').select('scorers').not('scorers', 'is', null),
  ])
  const all = (matches ?? []) as Match[]
  const goleadores = topScorers((allMatches ?? []) as Match[]).slice(0, 10)

  const params = await searchParams
  const sel = GROUPS.includes(params.g ?? '') ? params.g! : 'K'
  const groupMatches = all.filter((m) => m.group_name === sel)
  const table = groupTable(groupMatches)
  const jugados = groupMatches.filter((m) => m.status === 'finished').length

  return (
    <div className="shell">
      <div className="shell-content fade relative">
        <span className="trophy-watermark" aria-hidden>🏆</span>
        <div className="appbar relative z-[1]">
          <div>
            <div className="kicker">📊 En vivo, como en la FIFA</div>
            <h2 className="display">Grupos del<br />Mundial</h2>
          </div>
          <span className="pill" style={{ background: 'var(--yellow)' }}>A–L</span>
        </div>

        {/* Selector de grupo */}
        <div className="chips">
          {GROUPS.map((g) => (
            <Link key={g} href={`/simulador?g=${g}`} className={`chip ${g === sel ? 'on' : ''}`}>
              {g === 'K' ? '🇨🇴 K' : g}
            </Link>
          ))}
        </div>

        <div className="px-[18px] pb-2">
          <h1 className="display text-xl uppercase">Grupo {sel}{sel === 'K' && ' 🇨🇴'}</h1>
          <p className="text-[11px] font-bold" style={{ color: 'var(--muted)' }}>
            {jugados} de {groupMatches.length} partidos jugados · clasifican 1º y 2º (+ mejores 3º)
          </p>
        </div>

        {/* Tabla del grupo */}
        <div className="mx-[14px] rounded-xl overflow-hidden" style={{ border: '2.5px solid var(--ink)' }}>
          <div className="grid items-center text-[10px] font-extrabold uppercase" style={{ gridTemplateColumns: '26px 1fr 26px 26px 32px 34px', background: 'var(--ink)', color: 'var(--cream)' }}>
            <span className="text-center py-1.5">#</span>
            <span className="py-1.5">Equipo</span>
            <span className="text-center" title="Jugados">PJ</span>
            <span className="text-center" title="Diferencia">DG</span>
            <span className="text-center" title="Goles">GF</span>
            <span className="text-center" title="Puntos">PTS</span>
          </div>
          {table.map((r, i) => {
            const clasifica = i < 2
            const tercero = i === 2
            const esCol = r.team === 'Colombia'
            return (
              <div
                key={r.team}
                className="grid items-center text-[12px] font-bold"
                style={{
                  gridTemplateColumns: '26px 1fr 26px 26px 32px 34px',
                  background: esCol ? 'rgba(255,194,46,.18)' : clasifica ? 'rgba(27,145,80,.16)' : tercero ? 'rgba(255,194,46,.10)' : 'var(--paper)',
                  borderTop: '1.5px solid var(--ink)',
                  color: 'var(--ink)',
                }}
              >
                <span className="text-center py-2 font-extrabold">{i + 1}</span>
                <span className="py-2 truncate">{teamFlag(r.team)} {teamShort(r.team)}</span>
                <span className="text-center">{r.pj}</span>
                <span className="text-center">{r.dif > 0 ? `+${r.dif}` : r.dif}</span>
                <span className="text-center">{r.gf}</span>
                <span className="text-center font-extrabold" style={{ color: clasifica ? 'var(--green)' : 'var(--ink)' }}>{r.pts}</span>
              </div>
            )
          })}
        </div>

        {/* Notas con humor por posición */}
        <div className="px-[18px] pt-3 space-y-1">
          {table.map((r, i) => (
            <p key={r.team} className="text-[11px] font-bold" style={{ color: 'var(--muted)' }}>
              <b style={{ color: 'var(--ink)' }}>{i + 1}. {teamShort(r.team)}</b> — {note(i, table.length, r.pj)}
            </p>
          ))}
        </div>

        {/* Partidos del grupo */}
        <div className="subhead">Partidos del grupo {sel}</div>
        <div className="px-[14px] space-y-2">
          {groupMatches.map((m) => {
            const fin = m.status === 'finished'
            const live = m.status === 'live'
            return (
              <div key={m.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ border: '2px solid var(--ink)', background: live ? 'var(--cream-2)' : 'var(--paper)' }}>
                <span className="text-[12px] font-extrabold truncate flex-1 text-right">{teamFlag(m.home_team)} {teamShort(m.home_team)}</span>
                <span className="display text-base px-2.5 mx-1 rounded" style={{ background: fin || live ? 'var(--yellow)' : 'transparent', color: 'var(--ink)', minWidth: 56, textAlign: 'center' }}>
                  {m.home_score != null ? `${m.home_score}-${m.away_score}` : 'vs'}
                </span>
                <span className="text-[12px] font-extrabold truncate flex-1">{teamShort(m.away_team)} {teamFlag(m.away_team)}</span>
              </div>
            )
          })}
        </div>

        {/* Goleadores del Mundial */}
        <div className="subhead">🥅 Tabla de goleadores</div>
        {goleadores.length === 0 ? (
          <p className="px-[18px] text-[12px] font-bold" style={{ color: 'var(--muted)' }}>Aún sin goles registrados… paciencia, que ya van a caer ⚽</p>
        ) : (
          <div className="mx-[14px] rounded-xl overflow-hidden" style={{ border: '2.5px solid var(--ink)' }}>
            {goleadores.map((s, i) => (
              <div key={s.name} className="flex items-center gap-2 px-3 py-2 text-[13px] font-bold" style={{ background: i === 0 ? 'rgba(255,194,46,.20)' : i % 2 ? 'var(--cream)' : 'var(--paper)', borderTop: i ? '1.5px solid var(--ink)' : 'none', color: 'var(--ink)' }}>
                <span className="w-6 text-center font-extrabold">{i === 0 ? '👟' : i + 1}</span>
                <span className="flex-1 truncate">{s.name}</span>
                <span className="display text-base" style={{ color: 'var(--red-d)' }}>{s.goals}</span>
                <span className="text-[10px]" style={{ color: 'var(--muted)' }}>{s.goals === 1 ? 'gol' : 'goles'}</span>
              </div>
            ))}
          </div>
        )}
        <p className="px-[18px] pt-2 text-[11px] font-bold" style={{ color: 'var(--muted)' }}>
          🦅 MFito: “Yo pronostiqué que el goleador sería un arquero… nadie me creyó.”
        </p>

        {/* Bullying de las mascotas */}
        <div className="castigo" style={{ background: 'var(--ink)' }}>
          <div className="big">🐷</div>
          <div className="t">
            <b style={{ color: 'var(--yellow)' }}>Cerdiño:</b> “El que quede 4º del grupo… ¡va comprando el cerdo y el tiquete de vuelta a casa!”
            {table.length === 4 && table[3].pj > 0 && (
              <> Hoy ese puesto es de <b style={{ color: '#fff' }}>{teamShort(table[3].team)}</b> 🛫</>
            )}
            <br /><b style={{ color: 'var(--yellow)' }}>🦅 MFito:</b> “Yo tenía otro pronóstico… pero mejor me callo.”
          </div>
        </div>
        <div className="spacer" />
      </div>
      <Nav session={session} active="simulador" />
    </div>
  )
}
