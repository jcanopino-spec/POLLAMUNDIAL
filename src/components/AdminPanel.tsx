'use client'

import { useActionState, useState, useTransition } from 'react'
import {
  createParticipant,
  deleteParticipant,
  forceSyncNow,
  resetPin,
  setManualResult,
  updateParticipantInfo,
} from '@/app/admin/actions'
import { teamFlag, teamShort } from '@/lib/teams'
import { avatarFor } from '@/lib/avatar'

type ParticipantRow = {
  id: string
  name: string
  is_admin: boolean
  champion_team: string | null
  house_number: string | null
  nickname: string | null
}
type MatchOption = { id: number; home_team: string; away_team: string; kickoffLabel: string; status: string }

const miniBtn: React.CSSProperties = {
  border: '2px solid var(--ink)', borderRadius: 9, padding: '4px 8px',
  fontSize: 11, fontWeight: 800, background: 'var(--cream)', cursor: 'pointer',
}

export function ParticipantsAdmin({ participants, myId }: { participants: ParticipantRow[]; myId: string }) {
  const [state, action, pending] = useActionState(createParticipant, null)
  const [busy, startTransition] = useTransition()
  const [feedback, setFeedback] = useState('')

  return (
    <section className="card mx-[18px] mb-4">
      <p className="display text-lg uppercase">Vecinos ({participants.length}/100)</p>
      <p className="text-xs font-bold mb-3" style={{ color: 'var(--muted)' }}>
        Todos arrancan con PIN <b style={{ color: 'var(--green)' }}>2026</b> y lo cambian al entrar. La casa alimenta la guerra de casas 🏠.
      </p>

      <form action={action} className="space-y-2 mb-4">
        <input name="name" placeholder="Nombre" required className="input" />
        <div className="flex gap-2">
          <input name="house" placeholder="Casa #" required className="input" style={{ width: 90 }} />
          <input name="nickname" placeholder="Apodo (opcional)" className="input flex-1" />
          <label className="flex items-center gap-1 text-[11px] font-extrabold shrink-0" style={{ color: 'var(--muted)' }}>
            <input type="checkbox" name="is_admin" /> admin
          </label>
        </div>
        <button disabled={pending} className="savebtn">
          {pending ? 'CREANDO…' : 'CREAR VECINO · PIN 2026'}
        </button>
      </form>
      {state && 'error' in state && state.error && <p className="text-xs font-bold mb-2" style={{ color: 'var(--red-d)' }}>{state.error}</p>}
      {state && 'ok' in state && state.ok && <p className="text-xs font-bold mb-2" style={{ color: 'var(--green)' }}>{state.ok}</p>}
      {feedback && <p className="text-xs font-bold mb-2" style={{ color: 'var(--blue)' }}>{feedback}</p>}

      <ul className="divide-y" style={{ borderColor: 'var(--cream-2)' }}>
        {participants.map((p) => (
          <li key={p.id} className="py-2 flex items-center gap-2">
            <div className="av" style={{ width: 32, height: 32, fontSize: 18 }}>{avatarFor(p.nickname || p.name)}</div>
            <span className="flex-1 text-sm font-extrabold min-w-0 truncate">
              {p.name}
              {p.nickname && <span className="font-bold italic" style={{ color: 'var(--muted)' }}> “{p.nickname}”</span>}
              {p.house_number && <span className="text-[11px]" style={{ color: 'var(--blue)' }}> 🏠{p.house_number}</span>}
              {p.is_admin && <span className="text-[9px] ml-1 px-1.5 py-0.5 rounded-full" style={{ background: 'var(--green)', color: '#fff' }}>ADMIN</span>}
            </span>
            <button
              disabled={busy}
              style={miniBtn}
              onClick={() => {
                const house = prompt(`Casa de ${p.name}:`, p.house_number ?? '')
                if (house == null) return
                const nickname = prompt(`Apodo de ${p.name} (vacío para quitar):`, p.nickname ?? '') ?? ''
                startTransition(async () => {
                  const r = await updateParticipantInfo(p.id, house, nickname)
                  setFeedback(r?.error ?? `${p.name} actualizado.`)
                })
              }}
            >
              ✏️
            </button>
            <button
              disabled={busy}
              style={miniBtn}
              onClick={() => {
                if (!confirm(`¿Restablecer el PIN de ${p.name} a 2026?`)) return
                startTransition(async () => {
                  const r = await resetPin(p.id)
                  setFeedback(r?.error ?? `PIN de ${p.name} → 2026.`)
                })
              }}
            >
              PIN
            </button>
            {p.id !== myId && (
              <button
                disabled={busy}
                style={{ ...miniBtn, color: 'var(--red-d)' }}
                onClick={() => {
                  if (!confirm(`¿Eliminar a ${p.name} y todos sus pronósticos?`)) return
                  startTransition(async () => {
                    const r = await deleteParticipant(p.id)
                    setFeedback(r?.error ?? `${p.name} eliminado.`)
                  })
                }}
              >
                🗑️
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
    <section className="card mx-[18px] mb-4">
      <p className="display text-lg uppercase">Resultado manual</p>
      <p className="text-xs font-bold mb-3" style={{ color: 'var(--muted)' }}>
        Úsalo si el feed se demora. En eliminatorias con penales, escribe el ganador.
      </p>
      <form action={action} className="space-y-2">
        <select name="match_id" required className="input">
          <option value="">— Elige el partido —</option>
          {matches.map((m) => (
            <option key={m.id} value={m.id}>
              P{m.id} · {teamShort(m.home_team)} vs {teamShort(m.away_team)} · {m.kickoffLabel}
              {m.status === 'finished' ? ' ✓' : ''}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <input name="home_score" type="number" min={0} max={99} placeholder="Local" required className="input" />
          <input name="away_score" type="number" min={0} max={99} placeholder="Visita" required className="input" />
        </div>
        <input name="winner" placeholder="Ganador si hubo penales (en inglés, ej. Colombia)" className="input" />
        <button disabled={pending} className="savebtn">{pending ? 'GUARDANDO…' : 'GUARDAR RESULTADO'}</button>
      </form>
      {state && 'error' in state && state.error && <p className="text-xs font-bold mt-2" style={{ color: 'var(--red-d)' }}>{state.error}</p>}
      {state && 'ok' in state && state.ok && <p className="text-xs font-bold mt-2" style={{ color: 'var(--green)' }}>{state.ok}</p>}
    </section>
  )
}

export function SyncAdmin({ lastSync }: { lastSync: string | null }) {
  const [msg, setMsg] = useState('')
  const [busy, startTransition] = useTransition()

  return (
    <section className="card mx-[18px] mb-4">
      <p className="display text-lg uppercase">Sincronización</p>
      <p className="text-xs font-bold mb-3" style={{ color: 'var(--muted)' }}>
        Automática al abrir la app (máx. c/5 min) + cron diario. Última: <b style={{ color: 'var(--ink)' }}>{lastSync ?? 'nunca'}</b>
      </p>
      <button
        disabled={busy}
        className="savebtn"
        style={{ background: 'var(--blue)' }}
        onClick={() =>
          startTransition(async () => {
            const r = await forceSyncNow()
            setMsg(('error' in r && r.error) || ('ok' in r && r.ok) || '')
          })
        }
      >
        {busy ? 'SINCRONIZANDO…' : '↻ SINCRONIZAR AHORA'}
      </button>
      {msg && <p className="text-xs font-bold mt-2" style={{ color: 'var(--ink)' }}>{msg}</p>}
    </section>
  )
}
