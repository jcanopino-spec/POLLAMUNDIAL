import { redirect } from 'next/navigation'
import Nav from '@/components/Nav'
import { adminDb, type Participant } from '@/lib/db'
import { getSession } from '@/lib/session'
import { FINAL_MATCH_ID, type Scoring } from '@/lib/scoring'
import { isPlaceholder, teamFlag, teamShort } from '@/lib/teams'
import { syncResults } from '@/lib/sync'
import { avatarFor } from '@/lib/avatar'

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
  const realFinalists =
    final && !isPlaceholder(final.home_team) && !isPlaceholder(final.away_team)
      ? [final.home_team, final.away_team]
      : []

  // Los admin (jcanopino) administran, no participan
  const rows = ((participants ?? []) as Participant[]).filter((p) => !p.is_admin).map((p) => {
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

  // Frase de cada jugador (con humor, estilo del diseño)
  const note = (r: (typeof rows)[number], i: number): string => {
    if (i === 0 && r.total > 0) return '👑 manda en la mesa'
    if (i === rows.length - 1 && rows.length > 2) return '🐷 va por el cerdo'
    if (r.championHit) return `clavó al campeón +${scoring?.champion_bonus ?? 30} 👑`
    if (r.exact > 1) return `${r.exact} exactos · francotirador 🎯`
    if (r.exact === 1) return 'clavó un marcador 🎯'
    if (r.outcome > 0) return `${r.outcome} acierto(s) ✔️`
    if (r.champion_team) return `le apuesta a ${teamShort(r.champion_team)} ${teamFlag(r.champion_team)}`
    return 'pronostica con el corazón 💘'
  }

  // 🏠 Guerra de casas
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

  const played = actual.size
  const last = rows.length > 2 ? rows[rows.length - 1] : null

  return (
    <div className="shell">
      <div className="shell-content fade relative">
        <span className="trophy-watermark" aria-hidden>🏆</span>
        <div className="appbar relative z-[1]">
          <div>
            <div className="kicker">⚽ {played} de 104 jugados</div>
            <h2 className="display"><span className="trophy-float">🐷</span> La tabla<br />del cerdo</h2>
          </div>
          <a href="/parche" className="pill" style={{ background: 'var(--yellow)' }}>{rows.length} 👥 →</a>
        </div>

        {/* Las dos mascotas presiden la tabla: MFito (arriba) y Cerdiño (colero) */}
        <div className="mx-[18px] mb-3 rounded-2xl overflow-hidden relative z-[1]" style={{ border: '3px solid var(--ink)', background: 'linear-gradient(100deg, #14120f 0%, #2a2417 100%)', boxShadow: '0 5px 0 var(--ink)' }}>
          <div className="flex items-stretch">
            {/* MFito felicita al líder */}
            <div className="flex items-center gap-2 flex-1 min-w-0 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/mfito-head.png" alt="MFito" className="h-[58px] w-[58px] shrink-0" />
              <div className="min-w-0">
                <p className="display text-[13px] uppercase leading-none" style={{ color: '#F7D56B' }}>MFito 🦅</p>
                <p className="text-[10px] font-bold" style={{ color: '#e8dcc8' }}>
                  “Felicito al de arriba… aunque yo lo hubiera hecho mejor 😎”
                </p>
              </div>
            </div>
            {/* Cerdiño vigila al colero */}
            <div className="flex items-center gap-2 flex-1 min-w-0 p-2" style={{ borderLeft: '2px solid var(--ink)', background: 'rgba(70,110,55,.18)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/cerdino-head.png" alt="Cerdiño" className="h-[58px] w-[58px] shrink-0" />
              <div className="min-w-0">
                <p className="display text-[13px] uppercase leading-none" style={{ color: '#9fdc8c' }}>Cerdiño 🐷</p>
                <p className="text-[10px] font-bold" style={{ color: '#e8dcc8' }}>
                  {last ? <>“Le voy reservando el cerdo a <b style={{ color: '#fff' }}>{last.nickname || last.name}</b> 😏”</> : '“¿Quién paga el cerdo? Ya veremos…”'}
                </p>
              </div>
            </div>
          </div>
          <p className="text-center text-[10px] font-bold py-1" style={{ background: 'var(--ink)', color: '#cbbfae' }}>
            🦅 MF Group · 🐷 Unión Porcícola — ¡el último pone el guaro y el cerdo!
          </p>
        </div>

        <div className="rk-list">
          {rows.map((r, i) => {
            const isMe = r.id === session.id
            const cls = `row${i === 0 ? ' lead' : ''}${isMe ? ' me' : ''}${i === rows.length - 1 && rows.length > 2 ? ' last' : ''}`
            return (
              <div className={cls} key={r.id}>
                <div className="pos">{i + 1}</div>
                <div className="av" style={i === 0 ? { background: '#FFE08A' } : {}}>{avatarFor(r.nickname || r.name)}</div>
                <div className="nm">
                  <b>
                    {r.nickname || r.name}
                    {isMe && <span style={{ color: 'var(--blue)' }}> · tú</span>}
                    {r.house_number && <span className="font-normal text-[11px]" style={{ color: 'var(--muted)' }}> 🏠{r.house_number}</span>}
                  </b>
                  {i === 0 || (i === rows.length - 1 && rows.length > 2) ? (
                    <span className="tag-mini" style={i === 0 ? { background: '#fff' } : { background: 'var(--red)', color: '#fff' }}>
                      {note(r, i)}
                    </span>
                  ) : (
                    <small>{note(r, i)}</small>
                  )}
                  {/* Apuestas grandes a la vista de todos (transparencia) */}
                  {r.champion_team ? (
                    <small className="block mt-0.5" style={{ color: 'var(--ink)' }}>
                      🏁 {teamFlag(r.finalist1!)} {teamFlag(r.finalist2!)} · 👑 {teamFlag(r.champion_team)} {teamShort(r.champion_team)} 🏆
                    </small>
                  ) : (
                    <small className="block mt-0.5" style={{ color: 'var(--muted)' }}>🤔 sin apuesta grande aún</small>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="pts">{r.total}<small>PTS</small></div>
                  {r.bonus > 0 && <div className="text-[11px] font-extrabold" style={{ color: 'var(--green)' }}>⭐ +{r.bonus}</div>}
                </div>
              </div>
            )
          })}
        </div>

        <div className="castigo">
          <div className="big">🐷</div>
          <div className="t">
            Quien quede <b>último</b> al final del Mundial pone el <b>guaro</b> y el <b>cerdo de la porcícola</b>.
            {last && <> Va perdiendo <b>{last.nickname || last.name}</b> 😅 — ¡no te descuides!</>}
          </div>
        </div>

        {/* 🏠 Guerra de casas */}
        {houses.length >= 2 && (
          <>
            <div className="subhead">🏠 La guerra de casas</div>
            <p className="px-[18px] pb-3 text-xs font-bold -mt-1" style={{ color: 'var(--muted)' }}>
              Los puntos de cada parcero futbolero suman pa’ su casa. Honor para una… sancocho para otra.
            </p>
            <div className="rk-list">
              {houses.map((h, i) => {
                const first = i === 0
                const lastH = i === houses.length - 1
                return (
                  <div key={h.house} className={`row${first ? ' lead' : ''}${lastH ? ' last' : ''}`}>
                    <div className="av" style={{ fontSize: 20 }}>{first ? '👑' : lastH ? '🥄' : '🏠'}</div>
                    <div className="nm">
                      <b>Casa {h.house}</b>
                      <small>
                        {first ? 'aquí SÍ se ve fútbol 🔥 · ' : lastH ? 'van pagando el sancocho 🍲 · ' : ''}
                        {h.members.map((m) => m.nickname || m.name).join(' · ')}
                      </small>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="pts">{h.total}<small>PTS</small></div>
                      <div className="text-[10px] font-extrabold" style={{ color: 'var(--muted)' }}>prom. {h.avg.toFixed(1)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="px-[18px] pt-1 text-[11px] font-bold" style={{ color: 'var(--muted)' }}>
              * Casa que recluta más gente, suma más… así que recluten 😏
            </p>
          </>
        )}

        <p className="px-[18px] pt-4 text-[11px] font-bold" style={{ color: 'var(--muted)' }}>
          🎯 exacto {scoring?.exact ?? 5} · ✔️ resultado {scoring?.outcome ?? 3} (suben por fase) · ⭐ finalista +{scoring?.finalist_bonus ?? 15} ·
          👑 campeón +{scoring?.champion_bonus ?? 30}. La tabla se actualiza solita al final de cada partido. La gallina 🐔 no acepta sobornos.
        </p>
        <div className="spacer" />
      </div>
      <Nav session={session} active="posiciones" />
    </div>
  )
}
