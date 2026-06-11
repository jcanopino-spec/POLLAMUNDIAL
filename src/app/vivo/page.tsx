import { redirect } from 'next/navigation'
import Nav from '@/components/Nav'
import { adminDb, type Match } from '@/lib/db'
import { getSession } from '@/lib/session'
import { multiplierFor, type Scoring } from '@/lib/scoring'
import { teamFlag, teamShort, formatKickoff } from '@/lib/teams'
import { avatarFor } from '@/lib/avatar'
import { stadiumOf } from '@/lib/stadiums'
import { syncResults } from '@/lib/sync'
import { FIFA_URL } from '@/lib/calendar'

export const dynamic = 'force-dynamic'

const sign = (n: number) => (n > 0 ? 1 : n < 0 ? -1 : 0)

export default async function VivoPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  await syncResults().catch(() => {})

  const db = adminDb()
  const [{ data: matches }, { data: parts }, { data: cfg }, { data: preds }] = await Promise.all([
    db.from('matches').select('*').order('kickoff_utc'),
    db.from('participants').select('id, name, nickname, house_number, is_admin'),
    db.from('settings').select('value').eq('key', 'scoring').single(),
    db.from('predictions').select('participant_id, match_id, home_score, away_score'),
  ])
  const all = (matches ?? []) as Match[]
  const scoring = cfg?.value as Scoring
  const nameOf = new Map((parts ?? []).filter((p) => !p.is_admin).map((p) => [p.id, p]))

  const live = all.filter((m) => m.status === 'live')
  const finished = all.filter((m) => m.status === 'finished').reverse() // más recientes primero

  // Pronósticos por partido
  const predsByMatch = new Map<number, typeof preds>()
  for (const p of preds ?? []) {
    if (!nameOf.has(p.participant_id)) continue
    if (!predsByMatch.has(p.match_id)) predsByMatch.set(p.match_id, [])
    predsByMatch.get(p.match_id)!.push(p)
  }

  // Para un partido finalizado: lista cómica de aciertos
  function reporte(m: Match) {
    const mult = multiplierFor(m.id, m.round, scoring)
    const exactPts = scoring.exact * mult
    const list = (predsByMatch.get(m.id) ?? []).map((p) => {
      const exacto = p.home_score === m.home_score && p.away_score === m.away_score
      const acierto = sign(p.home_score - p.away_score) === sign(m.home_score! - m.away_score!)
      const pts = exacto ? exactPts : acierto ? scoring.outcome * mult : 0
      const part = nameOf.get(p.participant_id)!
      return { nm: part.nickname || part.name, casa: part.house_number, pred: `${p.home_score}-${p.away_score}`, pts, kind: exacto ? 'hit' : acierto ? 'part' : 'miss' as const }
    })
    list.sort((a, b) => b.pts - a.pts || a.nm.localeCompare(b.nm))
    return { list, exactPts }
  }

  const frase = (kind: string, nm: string): string => {
    if (kind === 'hit') return `🎯 ¡CLAVÓ EL MARCADOR! Genio, máquina, ${nm} 🔥`
    if (kind === 'part') return `✔️ le achuntó al ganador, sobrevive otra fecha`
    return `💀 ni cerca… vaya destapando el guaro`
  }

  return (
    <div className="shell">
      <div className="shell-content fade">
        <div className="appbar">
          <div>
            <div className="kicker" style={{ color: live.length ? 'var(--red)' : 'var(--green)' }}>
              {live.length ? `🔴 ${live.length} EN JUEGO` : '⚽ La cancha'}
            </div>
            <h2 className="display">En vivo</h2>
          </div>
          <a href={FIFA_URL} target="_blank" rel="noopener noreferrer" className="pill" style={{ background: 'var(--yellow)' }}>📊 FIFA ↗</a>
        </div>

        {/* PARTIDOS EN VIVO */}
        {live.length === 0 && finished.length === 0 && (
          <div className="card mx-[18px] text-center">
            <p className="text-3xl mb-1">⚽</p>
            <p className="font-extrabold text-sm">Todavía no rueda el balón…</p>
            <p className="text-xs font-bold mt-1" style={{ color: 'var(--muted)' }}>
              Cuando empiece un partido, aquí verás el marcador en vivo y, al terminar, quién acertó (y quién va por el cerdo 🐷).
            </p>
          </div>
        )}

        {live.map((m) => {
          const st = stadiumOf(m.venue)
          const cuantos = (predsByMatch.get(m.id) ?? []).length
          return (
            <div key={m.id} className="hero" style={{ margin: '0 18px 14px' }}>
              <div className="hp">
                <div className="tag" style={{ color: 'var(--red)' }}>🔴 EN VIVO {st && `· ${st.nombre}`}</div>
                <div className="vs">
                  <div className="team"><div className="fl">{teamFlag(m.home_team)}</div><div className="nm">{teamShort(m.home_team)}</div></div>
                  <div className="mid">
                    <div className="x" style={{ color: 'var(--cream)', fontSize: 34 }}>{m.home_score ?? 0}–{m.away_score ?? 0}</div>
                    <div className="when">{cuantos} parceros le apostaron</div>
                  </div>
                  <div className="team"><div className="fl">{teamFlag(m.away_team)}</div><div className="nm">{teamShort(m.away_team)}</div></div>
                </div>
              </div>
              <a href={FIFA_URL} target="_blank" rel="noopener noreferrer" className="cta">VER MINUTO A MINUTO EN FIFA.COM →</a>
            </div>
          )
        })}

        {/* RESULTADOS CON REPORTE CÓMICO */}
        {finished.length > 0 && <p className="subhead">📋 Resultados · ¿quién acertó?</p>}
        {finished.slice(0, 12).map((m) => {
          const { list, exactPts } = reporte(m)
          const ganaron = list.filter((x) => x.pts > 0)
          return (
            <div key={m.id} className="match mx-[18px] mb-3">
              <div className="mtop">
                <span className="grp">{m.group_name ? `Grupo ${m.group_name}` : ''} P{m.id}</span>
                <span>{formatKickoff(m.kickoff_utc)} · FINAL</span>
              </div>
              <div className="mbody" style={{ paddingBottom: 6 }}>
                <div className="mteam"><div className="fl">{teamFlag(m.home_team)}</div><div className="nm">{teamShort(m.home_team)}</div></div>
                <div className="resultline"><span className="big">{m.home_score}</span><span className="scoremid">:</span><span className="big">{m.away_score}</span></div>
                <div className="mteam"><div className="fl">{teamFlag(m.away_team)}</div><div className="nm">{teamShort(m.away_team)}</div></div>
              </div>
              <div className="px-3 pb-3">
                <p className="text-[11px] font-extrabold mb-1.5" style={{ color: 'var(--muted)' }}>
                  {ganaron.length === 0 ? '😂 ¡NADIE acertó! Todos pa’l cerdo 🐷' : `${ganaron.length} acertaron · exacto valía ${exactPts} pts`}
                </p>
                <div className="space-y-1">
                  {list.map((x, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg px-2 py-1" style={{ border: '1.5px solid var(--ink)', background: x.kind === 'hit' ? '#E3F4E9' : x.kind === 'part' ? '#FFF7DD' : '#FCE0DC' }}>
                      <span className="text-base">{avatarFor(x.nm)}</span>
                      <span className="flex-1 min-w-0 truncate text-[12px] font-extrabold">
                        {x.nm} <span className="font-bold" style={{ color: 'var(--muted)' }}>dijo {x.pred}</span>
                      </span>
                      <span className="text-[10px] font-bold hidden sm:block" style={{ color: 'var(--muted)' }}>{frase(x.kind, x.nm)}</span>
                      <span className="text-[13px] font-extrabold whitespace-nowrap" style={{ color: x.pts > 0 ? 'var(--green)' : 'var(--red-d)' }}>
                        {x.pts > 0 ? `+${x.pts}` : '0'} {x.kind === 'hit' ? '🎯' : x.kind === 'part' ? '✔️' : '💀'}
                      </span>
                    </div>
                  ))}
                  {list.length === 0 && <p className="text-[11px] font-bold" style={{ color: 'var(--muted)' }}>Nadie pronosticó este partido 🤷</p>}
                </div>
              </div>
            </div>
          )
        })}
        <div className="spacer" />
      </div>
      <Nav session={session} active="vivo" />
    </div>
  )
}
