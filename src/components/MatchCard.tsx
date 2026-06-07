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
  const [saved, setSaved] = useState<{ home: string; away: string } | null>(
    p.initialHome != null ? { home: String(p.initialHome), away: String(p.initialAway ?? '') } : null
  )
  const [home, setHome] = useState(saved?.home ?? '')
  const [away, setAway] = useState(saved?.away ?? '')
  // Sin pronóstico guardado → directo en modo edición; con uno → modo lectura con ✏️
  const [editing, setEditing] = useState(saved == null)
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  const complete = home !== '' && away !== ''

  function save() {
    if (!complete || p.locked || pending) return
    startTransition(async () => {
      const res = await savePrediction(p.matchId, Number(home), Number(away))
      if (res?.error) {
        setMsg({ text: res.error })
      } else {
        setSaved({ home, away })
        setEditing(false)
        setMsg({ ok: true, text: '✓ Guardado' })
      }
    })
  }

  function startEdit() {
    if (p.locked) return
    setMsg(null)
    setEditing(true)
  }

  function cancelEdit() {
    if (!saved) return
    setHome(saved.home)
    setAway(saved.away)
    setMsg(null)
    setEditing(false)
  }

  const scoreInput = (value: string, set: (v: string) => void, label: string) => (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      max={99}
      value={value}
      aria-label={label}
      disabled={p.locked || !editing}
      onChange={(e) => {
        set(e.target.value)
        setMsg(null)
      }}
      onKeyDown={(e) => e.key === 'Enter' && save()}
      className={`w-12 h-10 text-center rounded-lg border font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
        editing && !p.locked
          ? 'bg-slate-800 border-emerald-600/70 text-white focus:border-emerald-400'
          : 'bg-slate-900 border-slate-800 text-slate-300'
      }`}
    />
  )

  const esColombia = p.home === 'Colombia' || p.away === 'Colombia'

  return (
    <div
      className={`rounded-xl border p-3 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-900/30 ${
        p.status === 'live'
          ? 'border-amber-500/60 bg-amber-950/20'
          : esColombia
            ? 'border-yellow-500/50 bg-gradient-to-br from-yellow-950/30 via-blue-950/20 to-red-950/20'
            : 'border-slate-800 bg-slate-900/60'
      }`}
    >
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
        <span>
          P{p.matchId} · {p.kickoffLabel} <span className="text-slate-600">(Col)</span>
        </span>
        {p.status === 'live' && <span className="text-amber-400 font-semibold animate-pulse">● EN JUEGO</span>}
        {p.status === 'finished' && p.points != null && (
          <span className={`font-bold ${p.points > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
            {p.points >= p.maxExact ? `🎯 ¡EXACTO! +${p.points} pts 🎉` : p.points > 0 ? `✔️ +${p.points} pts` : '0 pts 🫠'}
          </span>
        )}
        {p.locked && p.status === 'scheduled' && <span title="Ya pitó el árbitro: cerrado">🔒</span>}
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

      {/* Acciones: ✏️ modificar / 💾 guardar (solo mientras no inicie el partido) */}
      {!p.locked && (
        <div className="flex items-center justify-center gap-2 mt-2">
          {editing ? (
            <>
              <button
                onClick={save}
                disabled={pending || !complete}
                title="Guardar pronóstico"
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 transition"
              >
                💾 {pending ? 'Guardando…' : 'Guardar'}
              </button>
              {saved && (
                <button
                  onClick={cancelEdit}
                  disabled={pending}
                  title="Cancelar cambios"
                  className="rounded-lg border border-slate-700 text-slate-400 hover:text-white text-xs px-3 py-1.5 transition"
                >
                  ✕ Cancelar
                </button>
              )}
            </>
          ) : (
            <button
              onClick={startEdit}
              title="Modificar pronóstico"
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 hover:border-emerald-500 text-slate-300 hover:text-emerald-300 text-xs font-semibold px-3 py-1.5 transition"
            >
              ✏️ Modificar
            </button>
          )}
        </div>
      )}

      {p.status === 'finished' && (
        <p className="text-center text-xs text-slate-400 mt-2">
          Resultado real: <span className="text-white font-bold">{p.actualHome} – {p.actualAway}</span>
        </p>
      )}

      <p className="text-center text-[10px] text-slate-500 mt-1.5 truncate">
        {p.venue && <>🏟️ {p.venue} · </>}📺 {p.tv}
      </p>

      <div className="h-4 mt-0.5 text-center text-xs">
        {msg && <span className={msg.ok ? 'text-emerald-400' : 'text-red-400'}>{msg.text}</span>}
        {!msg && !p.locked && !editing && saved && (
          <span className="text-slate-500">Tu pronóstico: {saved.home} – {saved.away} (puedes modificarlo hasta el pitazo)</span>
        )}
      </div>
    </div>
  )
}
