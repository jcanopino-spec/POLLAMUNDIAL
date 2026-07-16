'use client'

import { useState, useTransition } from 'react'
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
    winner: string | null
    winnerGoals: number | null
    scorers: string[]
    cornersTotal: number | null
    goalPhase: GoalPhase | null
    penalties: boolean
  } | null
}

export default function NecoEditor({ matchId, homeTeam, awayTeam, homeRoster, awayRoster, scoring, initial }: Props) {
  const [winner, setWinner] = useState<string | null>(initial?.winner ?? null)
  const [winnerGoals, setWinnerGoals] = useState<number>(initial?.winnerGoals ?? 1)
  const [scorers, setScorers] = useState<string[]>(initial?.scorers ?? [])
  const [corners, setCorners] = useState<string>(initial?.cornersTotal != null ? String(initial.cornersTotal) : '')
  const [phase, setPhase] = useState<GoalPhase | null>(initial?.goalPhase ?? null)
  const [penalties, setPenalties] = useState<boolean>(initial?.penalties ?? false)

  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null)

  const addScorer = () => setScorers((s) => [...s, ''])
  const setScorer = (i: number, v: string) => setScorers((s) => s.map((x, j) => (j === i ? v : x)))
  const delScorer = (i: number) => setScorers((s) => s.filter((_, j) => j !== i))

  function save() {
    if (pending) return
    if (!winner) { setMsg({ text: '⚠️ Elige el equipo ganador.' }); return }
    startTransition(async () => {
      const res = await saveNecoPrediction({
        matchId,
        winner,
        winnerGoals,
        scorers: scorers.filter(Boolean),
        cornersTotal: corners.trim() === '' ? null : parseInt(corners, 10),
        goalPhase: phase,
        penalties,
      })
      if (res?.error) setMsg({ text: res.error })
      else setMsg({ ok: true, text: `✅ ¡Quedó! Pronóstico NECO de la Casa ${res.house} guardado 🔒` })
    })
  }

  const chip = (active: boolean): React.CSSProperties => ({
    border: '2px solid var(--ink)', borderRadius: 10, padding: '8px 12px', fontWeight: 800,
    cursor: 'pointer', background: active ? 'var(--green)' : '#fff', color: active ? '#fff' : 'var(--ink)',
  })

  return (
    <div className="neco-form" style={{ display: 'grid', gap: 14 }}>
      {/* Ganador */}
      <div>
        <div className="neco-lbl">🏆 ¿Quién gana? <small>(+{scoring.winner})</small></div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[homeTeam, awayTeam].map((t) => (
            <button key={t} type="button" style={{ ...chip(winner === t), flex: 1, fontSize: 16 }} onClick={() => setWinner(t)}>
              {teamFlag(t)} {teamShort(t)}
            </button>
          ))}
        </div>
      </div>

      {/* Nº goles del ganador */}
      <div>
        <div className="neco-lbl">🔢 Nº de goles del equipo ganador <small>(+{scoring.winner_goals})</small></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" style={chip(false)} onClick={() => setWinnerGoals((n) => Math.max(0, n - 1))}>−</button>
          <span style={{ fontSize: 28, fontWeight: 900, minWidth: 34, textAlign: 'center' }}>{winnerGoals}</span>
          <button type="button" style={chip(false)} onClick={() => setWinnerGoals((n) => Math.min(15, n + 1))}>+</button>
        </div>
      </div>

      {/* Goleadores */}
      <div>
        <div className="neco-lbl">⚽ Autores de gol <small>(+{scoring.scorer} c/u · de cualquiera de los dos equipos)</small></div>
        <div style={{ display: 'grid', gap: 8 }}>
          {scorers.map((sel, i) => (
            <div key={i} style={{ display: 'flex', gap: 8 }}>
              <select value={sel} onChange={(e) => setScorer(i, e.target.value)}
                style={{ flex: 1, padding: '8px 10px', borderRadius: 10, border: '2px solid var(--ink)', fontWeight: 700 }}>
                <option value="">— elige goleador —</option>
                <optgroup label={`${teamShort(homeTeam)}`}>
                  {homeRoster.map((p) => <option key={`h${p}`} value={p}>{p}</option>)}
                </optgroup>
                <optgroup label={`${teamShort(awayTeam)}`}>
                  {awayRoster.map((p) => <option key={`a${p}`} value={p}>{p}</option>)}
                </optgroup>
              </select>
              <button type="button" style={chip(false)} onClick={() => delScorer(i)}>✕</button>
            </div>
          ))}
          <button type="button" style={{ ...chip(false), justifySelf: 'start' }} onClick={addScorer}>＋ agregar goleador</button>
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
            <button key={ph} type="button" style={chip(phase === ph)} onClick={() => setPhase((cur) => (cur === ph ? null : ph))}>
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

      <button className="btn green" style={{ marginTop: 4 }} disabled={pending} onClick={save}>
        {pending ? 'Guardando…' : initial ? '💾 Actualizar pronóstico de la casa' : '💾 Guardar pronóstico de la casa'}
      </button>
      {msg && <div className={`savedline${msg.ok ? '' : ' err'}`} style={{ fontWeight: 800, color: msg.ok ? 'var(--green)' : 'var(--red)' }}>{msg.text}</div>}
    </div>
  )
}
