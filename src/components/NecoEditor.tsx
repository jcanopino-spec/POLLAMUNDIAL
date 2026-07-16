'use client'

import { useEffect, useState, useTransition } from 'react'
import { saveNecoPrediction } from '@/app/neco/actions'
import { GOAL_PHASES, PHASE_SHORT, type GoalPhase, type NecoScoring } from '@/lib/neco'
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
    goalPhases: GoalPhase[]
    cornersTotal: number | null
    penalties: boolean
  } | null
}

const box = (active = false): React.CSSProperties => ({
  border: '2px solid var(--ink)', borderRadius: 10, padding: '8px 12px', fontWeight: 800,
  cursor: 'pointer', background: active ? 'var(--green)' : '#fff', color: active ? '#fff' : 'var(--ink)',
})
const sel: React.CSSProperties = { padding: '7px 8px', borderRadius: 9, border: '2px solid var(--ink)', fontWeight: 700, background: '#fff' }

function resize<T>(arr: T[], n: number, fill: T): T[] {
  const a = arr.slice(0, n)
  while (a.length < n) a.push(fill)
  return a
}

function TeamColumn({
  team, roster, goals, setGoals, authors, setAuthors, phases, setPhases,
}: {
  team: string; roster: string[]; goals: number; setGoals: (n: number) => void
  authors: string[]; setAuthors: (v: string[]) => void
  phases: string[]; setPhases: (v: string[]) => void
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
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textAlign: 'center' }}>Autor y tiempo de cada gol ⚽⏱️</div>
          {authors.map((a, i) => (
            <div key={i} style={{ display: 'grid', gap: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)' }}>Gol {i + 1}</div>
              <select value={a} style={{ ...sel, width: '100%' }} onChange={(e) => setAuthors(authors.map((x, j) => (j === i ? e.target.value : x)))}>
                <option value="">⚽ ¿quién lo marca?</option>
                {roster.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={phases[i] ?? ''} style={{ ...sel, width: '100%' }} onChange={(e) => setPhases(phases.map((x, j) => (j === i ? e.target.value : x)))}>
                <option value="">⏱️ ¿en qué tiempo?</option>
                {GOAL_PHASES.map((ph) => <option key={ph} value={ph}>{PHASE_SHORT[ph]}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function NecoEditor({ matchId, homeTeam, awayTeam, homeRoster, awayRoster, scoring, initial }: Props) {
  const hSet = new Set(homeRoster), aSet = new Set(awayRoster)
  const initHomeA = (initial?.scorers ?? []).filter((s) => hSet.has(s))
  const initAwayA = (initial?.scorers ?? []).filter((s) => aSet.has(s))
  const hg = initial?.homeScore ?? 0, ag = initial?.awayScore ?? 0
  // las etapas se guardan como multiset plano; se reparten home→away para el UI
  const initHomeP = (initial?.goalPhases ?? []).slice(0, hg)
  const initAwayP = (initial?.goalPhases ?? []).slice(hg, hg + ag)

  const [homeGoals, setHomeGoals] = useState(hg)
  const [awayGoals, setAwayGoals] = useState(ag)
  const [homeA, setHomeA] = useState<string[]>(() => resize(initHomeA, hg, ''))
  const [awayA, setAwayA] = useState<string[]>(() => resize(initAwayA, ag, ''))
  const [homeP, setHomeP] = useState<string[]>(() => resize(initHomeP as string[], hg, ''))
  const [awayP, setAwayP] = useState<string[]>(() => resize(initAwayP as string[], ag, ''))
  const [corners, setCorners] = useState<string>(initial?.cornersTotal != null ? String(initial.cornersTotal) : '')
  const [penalties, setPenalties] = useState<boolean>(initial?.penalties ?? false)

  useEffect(() => { setHomeA((p) => (p.length === homeGoals ? p : resize(p, homeGoals, ''))); setHomeP((p) => (p.length === homeGoals ? p : resize(p, homeGoals, ''))) }, [homeGoals])
  useEffect(() => { setAwayA((p) => (p.length === awayGoals ? p : resize(p, awayGoals, ''))); setAwayP((p) => (p.length === awayGoals ? p : resize(p, awayGoals, ''))) }, [awayGoals])

  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null)

  const totalGoals = homeGoals + awayGoals
  const authorsComplete = totalGoals === 0 || (homeA.every(Boolean) && awayA.every(Boolean))
  const phasesComplete = totalGoals === 0 || (homeP.every(Boolean) && awayP.every(Boolean))
  const complete = authorsComplete && phasesComplete
  const winner = homeGoals > awayGoals ? homeTeam : awayGoals > homeGoals ? awayTeam : null

  function save() {
    if (pending) return
    if (!authorsComplete) { setMsg({ text: '⚠️ Falta el autor de algún gol (no puede quedar en blanco).' }); return }
    if (!phasesComplete) { setMsg({ text: '⚠️ Falta asignar el tiempo de algún gol.' }); return }
    startTransition(async () => {
      const res = await saveNecoPrediction({
        matchId,
        homeScore: homeGoals,
        awayScore: awayGoals,
        scorers: [...homeA, ...awayA].filter(Boolean),
        goalPhases: [...homeP, ...awayP].filter(Boolean),
        cornersTotal: corners.trim() === '' ? null : parseInt(corners, 10),
        penalties,
      })
      if (res?.error) setMsg({ text: res.error })
      else setMsg({ ok: true, text: `✅ ¡Quedó! Pronóstico NECO de la Casa ${res.house} guardado 🔒` })
    })
  }

  return (
    <div className="neco-form" style={{ display: 'grid', gap: 14 }}>
      <div>
        <div className="neco-lbl">
          🎯 Tu marcador — <b>exacto +{scoring.exact}</b> · ganador +{scoring.winner} · nº goles del ganador +{scoring.winner_goals}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <TeamColumn team={homeTeam} roster={homeRoster} goals={homeGoals} setGoals={setHomeGoals} authors={homeA} setAuthors={setHomeA} phases={homeP} setPhases={setHomeP} />
          <div style={{ alignSelf: 'center', fontWeight: 900, fontSize: 20, color: 'var(--muted)' }}>:</div>
          <TeamColumn team={awayTeam} roster={awayRoster} goals={awayGoals} setGoals={setAwayGoals} authors={awayA} setAuthors={setAwayA} phases={awayP} setPhases={setAwayP} />
        </div>
        <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, color: 'var(--muted)', marginTop: 6 }}>
          {winner ? <>Ganador: {teamFlag(winner)} {teamShort(winner)} · {homeGoals}–{awayGoals}</> : <>Empate {homeGoals}–{awayGoals} (a penaltis)</>}
          {' · '}⚽ goleador +{scoring.scorer} · ⏱️ etapa de cada gol +{scoring.goal_phase}
          <br /><span style={{ fontSize: 11 }}>El tiempo de cada gol se revisa aparte del autor (no tienen que coincidir).</span>
        </div>
      </div>

      {/* Córners */}
      <div>
        <div className="neco-lbl">🚩 Tiros de esquina totales del partido <small>(+{scoring.corners})</small></div>
        <input inputMode="numeric" value={corners} onChange={(e) => setCorners(e.target.value.replace(/\D/g, '').slice(0, 2))}
          placeholder="ej: 9" style={{ width: 110, padding: '8px 12px', borderRadius: 10, border: '2px solid var(--ink)', fontWeight: 800, fontSize: 18 }} />
      </div>

      {/* Penaltis */}
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, cursor: 'pointer' }}>
          <input type="checkbox" checked={penalties} onChange={(e) => setPenalties(e.target.checked)} style={{ width: 20, height: 20 }} />
          🥅 Habrá tanda de penaltis <small>(+{scoring.penalties})</small>
        </label>
      </div>

      <button className="btn green" style={{ marginTop: 4, opacity: complete ? 1 : 0.6 }} disabled={pending} onClick={save}>
        {pending ? 'Guardando…' : !authorsComplete ? 'Faltan goleadores ⚽' : !phasesComplete ? 'Falta el tiempo de los goles ⏱️' : initial ? '💾 Actualizar pronóstico de la casa' : '💾 Guardar pronóstico de la casa'}
      </button>
      {msg && <div className={`savedline${msg.ok ? '' : ' err'}`} style={{ fontWeight: 800, color: msg.ok ? 'var(--green)' : 'var(--red)' }}>{msg.text}</div>}
    </div>
  )
}
