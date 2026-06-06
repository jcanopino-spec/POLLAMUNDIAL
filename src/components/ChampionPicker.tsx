'use client'

import { useState, useTransition } from 'react'
import { saveChampion } from '@/app/actions'
import { ALL_TEAMS, teamLabel } from '@/lib/teams'

export default function ChampionPicker({ initial, locked }: { initial: string | null; locked: boolean }) {
  const [pick, setPick] = useState(initial)
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  function choose(team: string) {
    if (locked || pending) return
    setPick(team)
    startTransition(async () => {
      const res = await saveChampion(team)
      if (res?.error) {
        setMsg({ text: res.error })
        setPick(initial)
      } else {
        setMsg({ ok: true, text: `✓ Tu campeón: ${teamLabel(team)}` })
      }
    })
  }

  return (
    <div>
      <div className="h-6 mb-3 text-sm">
        {pending && <span className="text-slate-400">Guardando…</span>}
        {!pending && msg && <span className={msg.ok ? 'text-emerald-400' : 'text-red-400'}>{msg.text}</span>}
        {!pending && !msg && pick && <span className="text-emerald-400">Tu campeón actual: {teamLabel(pick)}</span>}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {ALL_TEAMS.map((t) => (
          <button
            key={t}
            onClick={() => choose(t)}
            disabled={locked}
            className={`rounded-lg border px-3 py-2.5 text-sm text-left transition disabled:opacity-50 ${
              pick === t
                ? 'border-amber-400 bg-amber-950/40 text-amber-200 font-semibold'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-600'
            }`}
          >
            {teamLabel(t)}
          </button>
        ))}
      </div>
    </div>
  )
}
