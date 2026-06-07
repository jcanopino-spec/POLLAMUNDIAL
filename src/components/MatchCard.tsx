'use client'

import { useState, useTransition } from 'react'
import { savePrediction } from '@/app/actions'
import { teamLabel } from '@/lib/teams'

type Props = {
  matchId: number
  home: string
  away: string
  kickoffLabel: string
  venue: string | null
  tv: string
  locked: boolean
  status: 'scheduled' | 'live' | 'finished'
  actualHome: number | null
  actualAway: number | null
  initialHome: number | null
  initialAway: number | null
  points: number | null
  maxExact: number
}

export default function MatchCard(p: Props) {
  const [home, setHome] = useState(p.initialHome?.toString() ?? '')
  const [away, setAway] = useState(p.initialAway?.toString() ?? '')
  const [saved, setSaved] = useState<'idle' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [pending, startTransition] = useTransition()

  const dirty =
    home !== (p.initialHome?.toString() ?? '') || away !== (p.initialAway?.toString() ?? '')
  const complete = home !== '' && away !== ''

  function save() {
    if (!complete || !dirty || p.locked) return
    startTransition(async () => {
      const res = await savePrediction(p.matchId, Number(home), Number(away))
      if (res?.error) {
        setSaved('error')
        setErrorMsg(res.error)
      } else {
        setSaved('saved')
        setErrorMsg('')
      }
    })
  }

  const scoreInput = (value: string, set: (v: string) => void, label: string) => (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      max={99}
      value={value}
      aria-label={label}
      disabled={p.locked}
      onChange={(e) => {
        set(e.target.value)
        setSaved('idle')
      }}
      onBlur={save}
      className="w-12 h-10 text-center rounded-lg bg-slate-800 border border-slate-700 text-white font-bold disabled:opacity-40 disabled:bg-slate-900 focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
  )

  return (
    <div className={`rounded-xl border p-3 ${p.status === 'live' ? 'border-amber-500/60 bg-amber-950/20' : 'border-slate-800 bg-slate-900/60'}`}>
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
        <span>
          P{p.matchId} · {p.kickoffLabel} <span className="text-slate-600">(Col)</span>
        </span>
        {p.status === 'live' && <span className="text-amber-400 font-semibold animate-pulse">● EN JUEGO</span>}
        {p.status === 'finished' && p.points != null && (
          <span className={`font-bold ${p.points > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
            {p.points > 0 ? `+${p.points} pts` : '0 pts'}
          </span>
        )}
        {p.locked && p.status === 'scheduled' && <span>🔒</span>}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <span className="text-sm font-medium text-right truncate">{teamLabel(p.home)}</span>
        <div className="flex items-center gap-1.5">
          {scoreInput(home, setHome, `Goles ${p.home}`)}
          <span className="text-slate-500 font-bold">–</span>
          {scoreInput(away, setAway, `Goles ${p.away}`)}
        </div>
        <span className="text-sm font-medium truncate">{teamLabel(p.away)}</span>
      </div>

      {p.status === 'finished' && (
        <p className="text-center text-xs text-slate-400 mt-2">
          Resultado real: <span className="text-white font-bold">{p.actualHome} – {p.actualAway}</span>
        </p>
      )}

      <p className="text-center text-[10px] text-slate-500 mt-1.5 truncate">
        {p.venue && <>🏟️ {p.venue} · </>}📺 {p.tv}
      </p>

      <div className="h-4 mt-1 text-center text-xs">
        {pending && <span className="text-slate-400">Guardando…</span>}
        {!pending && saved === 'saved' && <span className="text-emerald-400">✓ Pronóstico guardado</span>}
        {!pending && saved === 'error' && <span className="text-red-400">{errorMsg}</span>}
        {!pending && saved === 'idle' && dirty && complete && !p.locked && (
          <button onClick={save} className="text-emerald-400 underline">Guardar</button>
        )}
      </div>
    </div>
  )
}
