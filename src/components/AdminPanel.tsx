'use client'

import { useActionState, useState, useTransition } from 'react'
import {
  createParticipant,
  deleteParticipant,
  forceSyncNow,
  resetPin,
  setManualResult,
} from '@/app/admin/actions'
import { teamLabel } from '@/lib/teams'

type ParticipantRow = { id: string; name: string; is_admin: boolean; champion_team: string | null }
type MatchOption = { id: number; home_team: string; away_team: string; kickoffLabel: string; status: string }

const inputCls =
  'rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500'

export function ParticipantsAdmin({ participants, myId }: { participants: ParticipantRow[]; myId: string }) {
  const [state, action, pending] = useActionState(createParticipant, null)
  const [busy, startTransition] = useTransition()
  const [feedback, setFeedback] = useState('')

  return (
    <section className="rounded-xl border border-slate-800 p-4">
      <h2 className="font-semibold mb-1">Participantes ({participants.length}/25)</h2>
      <p className="text-xs text-slate-500 mb-3">Crea a cada jugador con su PIN de 4 dígitos y compárteselo.</p>

      <form action={action} className="flex flex-wrap gap-2 mb-4">
        <input name="name" placeholder="Nombre" required className={`${inputCls} flex-1 min-w-32`} />
        <input name="pin" placeholder="PIN" inputMode="numeric" pattern="\d{4}" maxLength={4} required className={`${inputCls} w-20 text-center`} />
        <label className="flex items-center gap-1.5 text-xs text-slate-400">
          <input type="checkbox" name="is_admin" className="accent-emerald-600" /> admin
        </label>
        <button disabled={pending} className="rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2 text-sm font-semibold">
          {pending ? 'Creando…' : 'Crear'}
        </button>
      </form>
      {state && 'error' in state && state.error && <p className="text-red-400 text-xs mb-3">{state.error}</p>}
      {state && 'ok' in state && state.ok && <p className="text-emerald-400 text-xs mb-3">{state.ok}</p>}
      {feedback && <p className="text-amber-400 text-xs mb-3">{feedback}</p>}

      <ul className="divide-y divide-slate-800/70 text-sm">
        {participants.map((p) => (
          <li key={p.id} className="py-2 flex items-center gap-2">
            <span className="flex-1">
              {p.name}
              {p.is_admin && <span className="text-[10px] bg-emerald-900 text-emerald-300 rounded px-1.5 py-0.5 ml-2">ADMIN</span>}
            </span>
            <button
              disabled={busy}
              onClick={() => {
                const pin = prompt(`Nuevo PIN (4 dígitos) para ${p.name}:`)
                if (!pin) return
                startTransition(async () => {
                  const r = await resetPin(p.id, pin.trim())
                  setFeedback(r?.error ?? `PIN de ${p.name} actualizado.`)
                })
              }}
              className="text-xs text-slate-400 hover:text-white border border-slate-700 rounded px-2 py-1"
            >
              PIN
            </button>
            {p.id !== myId && (
              <button
                disabled={busy}
                onClick={() => {
                  if (!confirm(`¿Eliminar a ${p.name} y todos sus pronósticos?`)) return
                  startTransition(async () => {
                    const r = await deleteParticipant(p.id)
                    setFeedback(r?.error ?? `${p.name} eliminado.`)
                  })
                }}
                className="text-xs text-red-400/80 hover:text-red-300 border border-slate-700 rounded px-2 py-1"
              >
                Eliminar
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function ResultsAdmin({ matches }: { matches: MatchOption[] }) {
  const [state, action, pending] = useActionState(setManualResult, null)

  return (
    <section className="rounded-xl border border-slate-800 p-4">
      <h2 className="font-semibold mb-1">Resultado manual</h2>
      <p className="text-xs text-slate-500 mb-3">
        Úsalo si el feed se demora. En eliminatorias con penales, marca el ganador.
      </p>
      <form action={action} className="space-y-2">
        <select name="match_id" required className={`${inputCls} w-full`}>
          <option value="">— Elige el partido —</option>
          {matches.map((m) => (
            <option key={m.id} value={m.id}>
              P{m.id} · {teamLabel(m.home_team)} vs {teamLabel(m.away_team)} · {m.kickoffLabel}
              {m.status === 'finished' ? ' ✓' : ''}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <input name="home_score" type="number" min={0} max={99} placeholder="Local" required className={`${inputCls} w-24`} />
          <input name="away_score" type="number" min={0} max={99} placeholder="Visita" required className={`${inputCls} w-24`} />
          <button disabled={pending} className="rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2 text-sm font-semibold">
            {pending ? 'Guardando…' : 'Guardar resultado'}
          </button>
        </div>
        <input name="winner" placeholder="Ganador si hubo penales (nombre del equipo en inglés, ej. Colombia)" className={`${inputCls} w-full`} />
      </form>
      {state && 'error' in state && state.error && <p className="text-red-400 text-xs mt-2">{state.error}</p>}
      {state && 'ok' in state && state.ok && <p className="text-emerald-400 text-xs mt-2">{state.ok}</p>}
    </section>
  )
}

export function SyncAdmin({ lastSync }: { lastSync: string | null }) {
  const [msg, setMsg] = useState('')
  const [busy, startTransition] = useTransition()

  return (
    <section className="rounded-xl border border-slate-800 p-4">
      <h2 className="font-semibold mb-1">Sincronización de resultados</h2>
      <p className="text-xs text-slate-500 mb-3">
        Automática: cada vez que alguien abre la app (máx. cada 5 min) y con el cron diario de respaldo.
        Última: <span className="text-slate-300">{lastSync ?? 'nunca'}</span>
      </p>
      <button
        disabled={busy}
        onClick={() =>
          startTransition(async () => {
            const r = await forceSyncNow()
            setMsg(('error' in r && r.error) || ('ok' in r && r.ok) || '')
          })
        }
        className="rounded-lg bg-sky-700 hover:bg-sky-600 disabled:opacity-50 px-4 py-2 text-sm font-semibold"
      >
        {busy ? 'Sincronizando…' : '↻ Sincronizar ahora'}
      </button>
      {msg && <p className="text-xs mt-2 text-slate-300">{msg}</p>}
    </section>
  )
}
