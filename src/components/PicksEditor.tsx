'use client'

import { useState, useTransition } from 'react'
import { savePicks } from '@/app/actions'
import { ALL_TEAMS, teamLabel } from '@/lib/teams'

type Props = {
  initial: { finalist1: string | null; finalist2: string | null; champion: string | null }
  locked: boolean
  finalistBonus: number
  championBonus: number
  onSaved?: () => void
}

export default function PicksEditor({ initial, locked, finalistBonus, championBonus, onSaved }: Props) {
  const [finalists, setFinalists] = useState<string[]>(
    [initial.finalist1, initial.finalist2].filter(Boolean) as string[]
  )
  const [champion, setChampion] = useState(initial.champion)
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  function toggleFinalist(team: string) {
    if (locked) return
    setMsg(null)
    setFinalists((prev) => {
      if (prev.includes(team)) {
        if (champion === team) setChampion(null)
        return prev.filter((t) => t !== team)
      }
      if (prev.length >= 2) return [prev[1], team] // reemplaza el más viejo
      return [...prev, team]
    })
  }

  function save() {
    if (locked || finalists.length !== 2 || !champion) return
    startTransition(async () => {
      const res = await savePicks(finalists[0], finalists[1], champion)
      if (res?.error) setMsg({ text: res.error })
      else {
        setMsg({ ok: true, text: '✓ Apuestas grandes guardadas. Que los dioses del fútbol te acompañen ⚽' })
        onSaved?.()
      }
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold text-sm mb-1">
          1️⃣ Tus dos finalistas <span className="text-amber-400">({finalistBonus} pts cada uno)</span>
        </h3>
        <p className="text-xs text-slate-400 mb-2">Los dos equipos que según tú llegan a la final. Toca para elegir (máx. 2).</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {ALL_TEAMS.map((t) => (
            <button
              key={t}
              onClick={() => toggleFinalist(t)}
              disabled={locked}
              className={`rounded-lg border px-2.5 py-2 text-sm text-left transition disabled:opacity-50 ${
                finalists.includes(t)
                  ? 'border-emerald-400 bg-emerald-950/50 text-emerald-200 font-semibold'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-600'
              }`}
            >
              {teamLabel(t)}
            </button>
          ))}
        </div>
      </div>

      {finalists.length === 2 && (
        <div>
          <h3 className="font-semibold text-sm mb-1">
            2️⃣ Y de esos dos, tu campeón <span className="text-amber-400">({championBonus} pts)</span>
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {finalists.map((t) => (
              <button
                key={t}
                onClick={() => !locked && (setChampion(t), setMsg(null))}
                disabled={locked}
                className={`rounded-xl border-2 px-3 py-4 text-center font-bold transition disabled:opacity-50 ${
                  champion === t
                    ? 'border-amber-400 bg-amber-950/50 text-amber-200'
                    : 'border-slate-700 bg-slate-900 hover:border-slate-500'
                }`}
              >
                {champion === t && '👑 '}
                {teamLabel(t)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {msg && <p className={`text-sm ${msg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{msg.text}</p>}
        {!locked && (
          <button
            onClick={save}
            disabled={pending || finalists.length !== 2 || !champion}
            className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold py-2.5 transition"
          >
            {pending ? 'Guardando…' : finalists.length !== 2 ? 'Elige tus 2 finalistas' : !champion ? 'Falta coronar al campeón 👑' : 'Confirmar apuestas grandes 💰'}
          </button>
        )}
        {locked && <p className="text-xs text-slate-500">⛔ El Mundial ya comenzó: estas apuestas quedaron selladas.</p>}
      </div>
    </div>
  )
}
