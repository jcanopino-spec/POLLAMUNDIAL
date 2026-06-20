import Link from 'next/link'
import { redirect } from 'next/navigation'
import Nav from '@/components/Nav'
import AutoRefresh from '@/components/AutoRefresh'
import GoalBuzz from '@/components/GoalBuzz'
import { adminDb, type Match } from '@/lib/db'
import { getSession } from '@/lib/session'
import { multiplierFor, type Scoring } from '@/lib/scoring'
import { teamFlag, teamShort, formatKickoff } from '@/lib/teams'
import { avatarFor } from '@/lib/avatar'
import { stadiumOf } from '@/lib/stadiums'
import { syncResults } from '@/lib/sync'

export const dynamic = 'force-dynamic'

const sign = (n: number) => (n > 0 ? 1 : n < 0 ? -1 : 0)

// Estado en vivo de un pronóstico vs el marcador actual (los goles solo suben)
function estado(ph: number, pa: number, ch: number, ca: number) {
  const exactPosible = ch <= ph && ca <= pa
  const exactAhora = ch === ph && ca === pa
  const faltan = ph - ch + (pa - ca) // goles que faltan para el exacto (si es posible)
  const resultadoAhora = sign(ph - pa) === sign(ch - ca)
  if (exactAhora) return { txt: '🎯 ¡LA ESTÁ CLAVANDO! va exacto', cls: 'hit', orden: 0 }
  if (exactPosible && faltan === 1) return { txt: '🔥 ¡a UN gol del exacto! no respire', cls: 'fire', orden: 1 }
  if (exactPosible) return { txt: `🟢 el exacto sigue vivo (faltan ${faltan})`, cls: 'live', orden: 2 }
  if (resultadoAhora) return { txt: '✔️ salva el resultado (perdió el exacto ⚰️)', cls: 'part', orden: 3 }
  return { txt: '💀 se le fue todo… ¡al cerdo!', cls: 'miss', orden: 4 }
}

const COLOR: Record<string, string> = { hit: '#1B9150', fire: '#E1382F', live: '#2f7d3f', part: '#B8860B', miss: '#C12A22' }
const BG: Record<string, string> = { hit: '#E3F4E9', fire: '#FFE0DC', live: '#EAF6EE', part: '#FFF7DD', miss: '#FCE0DC' }

export default async function EnVivoPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  await syncResults().catch(() => {})

  const db = adminDb()
  const [{ data: matches }, { data: parts }, { data: cfg }, { data: preds }] = await Promise.all([
    db.from('matches').select('*').order('kickoff_utc'),
    db.from('participants').select('id, nickname, name, is_admin'),
    db.from('settings').select('value').eq('key', 'scoring').single(),
    db.from('predictions').select('participant_id, match_id, home_score, away_score'),
  ])
  const all = (matches ?? []) as Match[]
  const scoring = cfg?.value as Scoring
  const nameOf = new Map((parts ?? []).filter((p) => !p.is_admin).map((p) => [p.id, p.nickname || p.name]))
  const live = all.filter((m) => m.status === 'live')
  const next = all.find((m) => new Date(m.kickoff_utc).getTime() > Date.now())

  const predsByMatch = new Map<number, { nm: string; ph: number; pa: number }[]>()
  for (const p of preds ?? []) {
    if (!nameOf.has(p.participant_id)) continue
    if (!predsByMatch.has(p.match_id)) predsByMatch.set(p.match_id, [])
    predsByMatch.get(p.match_id)!.push({ nm: nameOf.get(p.participant_id)!, ph: p.home_score, pa: p.away_score })
  }

  return (
    <div className="shell">
      {live.length > 0 && <AutoRefresh seconds={30} />}
      <div className="shell-content fade">
        <div className="appbar">
          <div>
            <div className="kicker" style={{ color: live.length ? 'var(--red)' : 'var(--green)' }}>
              {live.length ? `🔴 ${live.length} EN JUEGO` : '⚽ La cancha'}
            </div>
            <h2 className="display">En vivo</h2>
          </div>
          <span className="pill" style={{ background: 'var(--yellow)' }}>⚔️ guillotina</span>
        </div>

        {live.length === 0 && (
          <div className="card mx-[18px] text-center">
            <p className="text-3xl mb-1">📺</p>
            <p className="font-extrabold text-sm">Ahorita no hay partido en juego</p>
            <p className="text-xs font-bold mt-1" style={{ color: 'var(--muted)' }}>
              Cuando empiece, aquí verás los pronósticos de TODOS moverse en vivo: a quién se le va el marcador,
              a quién le falta un gol… y a quién le cae la guillotina ⚔️
            </p>
            {next && (
              <p className="text-xs font-extrabold mt-3" style={{ color: 'var(--ink)' }}>
                Próximo: {teamFlag(next.home_team)} {teamShort(next.home_team)} vs {teamShort(next.away_team)} {teamFlag(next.away_team)}<br />
                <span style={{ color: 'var(--muted)' }}>{formatKickoff(next.kickoff_utc)} (Col)</span>
              </p>
            )}
          </div>
        )}

        {live.map((m) => {
          const ch = m.home_score ?? 0
          const ca = m.away_score ?? 0
          const st = stadiumOf(m.venue)
          const mult = multiplierFor(m.id, m.round, scoring)
          const list = (predsByMatch.get(m.id) ?? [])
            .map((p) => ({ ...p, e: estado(p.ph, p.pa, ch, ca) }))
            .sort((a, b) => a.e.orden - b.e.orden || a.nm.localeCompare(b.nm))
          const clavando = list.filter((p) => p.e.cls === 'hit')
          const muertos = list.filter((p) => p.e.cls === 'miss').length
          return (
            <div key={m.id} className="mx-[14px] mb-4">
              <GoalBuzz matchId={m.id} goals={ch + ca} />
              {/* Marcador en vivo */}
              <div className="hero" style={{ margin: 0 }}>
                <div className="hp">
                  <div className="tag" style={{ color: 'var(--red)' }}>🔴 EN VIVO {m.minute ? `· ${m.minute}` : ''} {st && `· ${st.nombre}`}</div>
                  <div className="vs">
                    <div className="team"><div className="fl">{teamFlag(m.home_team)}</div><div className="nm">{teamShort(m.home_team)}</div></div>
                    <div className="mid"><div className="x" style={{ color: 'var(--cream)', fontSize: 38 }}>{ch}–{ca}</div></div>
                    <div className="team"><div className="fl">{teamFlag(m.away_team)}</div><div className="nm">{teamShort(m.away_team)}</div></div>
                  </div>
                  {m.scorers && <p className="text-center text-[11px] font-bold pb-1" style={{ color: '#e8dcc8' }}>⚽ {m.scorers}</p>}
                </div>
              </div>

              {/* Resumen / chispa */}
              <div className="rounded-xl px-3 py-2 my-2 text-center" style={{ border: '2px solid var(--ink)', background: 'var(--ink)' }}>
                <p className="text-[12px] font-extrabold" style={{ color: 'var(--yellow)' }}>
                  {clavando.length > 0
                    ? `🎯 ¡${clavando.length} clavándola AHORA! (${clavando.slice(0, 3).map((p) => p.nm).join(', ')}${clavando.length > 3 ? '…' : ''})`
                    : '😱 ¡NADIE va clavando el marcador!'}
                </p>
                <p className="text-[11px] font-bold mt-0.5" style={{ color: '#cbbfae' }}>
                  ⚰️ {muertos} ya con un pie en el cerdo · exacto vale {scoring.exact * mult} pts
                </p>
              </div>

              {/* Lista de pronósticos en vivo */}
              <div className="space-y-1.5">
                {list.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5" style={{ border: '1.5px solid var(--ink)', background: BG[p.e.cls] }}>
                    <span className="text-base">{avatarFor(p.nm)}</span>
                    <span className="text-[12px] font-extrabold w-[88px] truncate" style={{ color: 'var(--ink)' }}>{p.nm}</span>
                    <span className="display text-[15px]" style={{ color: 'var(--ink)' }}>{p.ph}-{p.pa}</span>
                    <span className="flex-1 text-right text-[10.5px] font-bold" style={{ color: COLOR[p.e.cls] }}>{p.e.txt}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        <div className="castigo">
          <div className="big">⚔️</div>
          <div className="t">
            <b style={{ color: 'var(--yellow)' }}>🐷 Cerdiño:</b> “Cada gol manda gente pa’ la guillotina. ¡Yo solo afilo el cuchillo!”
            <br /><b style={{ color: 'var(--yellow)' }}>🦅 MFito:</b> “Refresca solo cada 30 seg. Quédate y sufre en vivo.”
          </div>
        </div>
        <div className="spacer" />
      </div>
      <Nav session={session} active="fixture" />
    </div>
  )
}
