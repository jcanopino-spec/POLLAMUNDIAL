'use client'

import { useEffect, useState, useTransition } from 'react'
import { saveNecoPrediction } from '@/app/neco/actions'
import { GOAL_PHASES, PHASE_LABEL, type GoalPhase, type NecoScoring } from '@/lib/neco'
import { teamFlag, teamShort } from '@/lib/teams'

type Props = {
  matchId: number
  homeTeam: string
  awayTeam: string
  homeRoster: string[]
  awayRoster: string[]
  scoring: NecoScoring
  initial: {
    homeScore: number | null
    awayScore: number | null
    scorers: string[]
    cornersTotal: number | null
    goalPhase: GoalPhase | null
    penalties: boolean
  } | null
}

const box = (active = false): React.CSSProperties => ({
  border: '2px solid var(--ink)', borderRadius: 10, padding: '8px 12px', fontWeight: 800,
  cursor: 'pointer', background: active ? 'var(--green)' : '#fff', color: active ? '#fff' : 'var(--ink)',
})
const selStyle: React.CSSProperties = { width: '100%', padding: '7px 8px', borderRadius: 9, border: '2px solid var(--ink)', fontWeight: 700 }

function resize(arr: string[], n: number): string[] {
  const a = arr.slice(0, n)
  while (a.length < n) a.push('')
  return a
}

function TeamColumn({
  team, roster, goals, setGoals, sel, setSel,
}: {
  team: string; roster: string[]; goals: number; setGoals: (n: number) => void
  sel: string[]; setSel: (v: string[]) => void
}) {
  return (
    <div style={{ flex: 1, minWidth: 0, border: '2px solid var(--ink)', borderRadius: 12, padding: 10, background: '#fffdf7' }}>
      <div style={{ textAlign: 'center', fontWeight: 900, fontSize: 16 }}>{teamFlag(team)} {teamShort(team)}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, margin: '8px 0' }}>
        <button type="button" style={box()} onClick={() => setGoals(Math.max(0, goals - 1))}>−</button>
        <span style={{ fontSize: 30, fontWeight: 900, minWidth: 30, textAlign: 'center' }}>{goals}</span>
        <button type="button" style={box()} onClick={() => setGoals(Math.min(15, goals + 1))}>+</button>
      </div>
      {goals > 0 && (
        <div style={{ display: 'grid', gap: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textAlign: 'center' }}>Autores del gol ⚽</div>
          {sel.map((s, i) => (
            <select key={i} value={s} style={selStyle} onChange={(e) => setSel(sel.map((x, j) => (j === i ? e.target.value : x)))}>
              <option value="">⚽ gol {i + 1} — ¿quién?</option>
              {roster.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          ))}
        </div>
      )}
    </div>
  )
}

export default function NecoEditor({ matchId, homeTeam, awayTeam, homeRoster, awayRoster, scoring, initial }: Props) {
  const hSet = new Set(homeRoster), aSet = new Set(awayRoster)
  const initHome = (initial?.scorers ?? []).filter((s) => hSet.has(s))
  const initAway = (initial?.scorers ?? []).filter((s) => aSet.has(s))

  const [homeGoals, setHomeGoals] = useState(initial?.homeScore ?? 0)
  const [awayGoals, setAwayGoals] = useState(initial?.awayScore ?? 0)
  const [homeSel, setHomeSel] = useState<string[]>(() => resize(initHome, initial?.homeScore ?? 0))
  const [awaySel, setAwaySel] = useState<string[]>(() => resize(initAway, initial?.awayScore ?? 0))
  const [corners, setCorners] = useState<string>(initial?.cornersTotal != null ? String(initial.cornersTotal) : '')
  const [phase, setPhase] = useState<GoalPhase | null>(initial?.goalPhase ?? null)
  const [penalties, setPenalties] = useState<boolean>(initial?.penalties ?? false)

  useEffect(() => { setHomeSel((prev) => (prev.length === homeGoals ? prev : resize(prev, homeGoals))) }, [homeGoals])
  useEffect(() => { setAwaySel((prev) => (prev.length === awayGoals ? prev : resize(prev, awayGoals))) }, [awayGoals])

  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null)

  const totalGoals = homeGoals + awayGoals
  const scorersComplete = totalGoals === 0 || (homeSel.every(Boolean) && awaySel.every(Boolean))
  const winner = homeGoals > awayGoals ? homeTeam : awayGoals > homeGoals ? awayTeam : null

  function save() {
    if (pending) return
    if (!scorersComplete) { setMsg({ text: `⚠️ Faltan goleadores: elige los ${totalGoals} autores (debajo de cada equipo).` }); return }
    startTransition(async () => {
      const res = await saveNecoPrediction({
        matchId,
        homeScore: homeGoals,
        awayScore: awayGoals,
        scorers: [...homeSel, ...awaySel].filter(Boolean),
        cornersTotal: corners.trim() === '' ? null : parseInt(corners, 10),
        goalPhase: phase,
        penalties,
      })
      if (res?.error) setMsg({ text: res.error })
      else setMsg({ ok: true, text: `✅ ¡Quedó! Pronóstico NECO de la Casa ${res.house} guardado 🔒` })
    })
  }

  return (
    <div className="neco-form" style={{ display: 'grid', gap: 14 }}>
      {/* Marcador por equipo (goles + goleadores debajo de cada uno) */}
      <div>
        <div className="neco-lbl">
          🎯 Tu marcador — <b>exacto +{scoring.exact}</b> · ganador +{scoring.winner} · nº goles del ganador +{scoring.winner_goals}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <TeamColumn team={homeTeam} roster={homeRoster} goals={homeGoals} setGoals={setHomeGoals} sel={homeSel} setSel={setHomeSel} />
          <div style={{ alignSelf: 'center', fontWeight: 900, fontSize: 20, color: 'var(--muted)' }}>:</div>
          <TeamColumn team={awayTeam} roster={awayRoster} goals={awayGoals} setGoals={setAwayGoals} sel={awaySel} setSel={setAwaySel} />
        </div>
        <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, color: 'var(--muted)', marginTop: 6 }}>
          {winner ? <>Ganador: {teamFlag(winner)} {teamShort(winner)} · marcador {homeGoals}–{awayGoals}</> : <>Empate {homeGoals}–{awayGoals} (a penaltis)</>}
          {' · '}⚽ cada goleador +{scoring.scorer} (así sea del perdedor)
        </div>
      </div>

      {/* Córners */}
      <div>
        <div className="neco-lbl">🚩 Tiros de esquina totales del partido <small>(+{scoring.corners})</small></div>
        <input inputMode="numeric" value={corners} onChange={(e) => setCorners(e.target.value.replace(/\D/g, '').slice(0, 2))}
          placeholder="ej: 9" style={{ width: 110, padding: '8px 12px', borderRadius: 10, border: '2px solid var(--ink)', fontWeight: 800, fontSize: 18 }} />
      </div>

      {/* Etapa de los goles */}
      <div>
        <div className="neco-lbl">⏱️ ¿En qué etapa caen los goles? <small>(+{scoring.goal_phase})</small></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {GOAL_PHASES.map((ph) => (
            <button key={ph} type="button" style={box(phase === ph)} onClick={() => setPhase((cur) => (cur === ph ? null : ph))}>
              {PHASE_LABEL[ph]}
            </button>
          ))}
        </div>
      </div>

      {/* Penaltis */}
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, cursor: 'pointer' }}>
          <input type="checkbox" checked={penalties} onChange={(e) => setPenalties(e.target.checked)} style={{ width: 20, height: 20 }} />
          🥅 Habrá tanda de penaltis <small>(+{scoring.penalties})</small>
        </label>
      </div>

      <button className="btn green" style={{ marginTop: 4, opacity: scorersComplete ? 1 : 0.6 }} disabled={pending} onClick={save}>
        {pending ? 'Guardando…' : !scorersComplete ? `Faltan goleadores ⚽` : initial ? '💾 Actualizar pronóstico de la casa' : '💾 Guardar pronóstico de la casa'}
      </button>
      {msg && <div className={`savedline${msg.ok ? '' : ' err'}`} style={{ fontWeight: 800, color: msg.ok ? 'var(--green)' : 'var(--red)' }}>{msg.text}</div>}
    </div>
  )
}
