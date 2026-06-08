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
      <p className="display text-lg uppercase">Parceros futboleros ({participants.length}/100)</p>
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
          {pending ? 'CREANDO…' : 'CREAR PARCERO · PIN 2026'}
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

// Avance de pronósticos por vecino: para recordarles y cazar morosos
export type ProgressRow = {
  id: string
  display: string
  house: string | null
  neverEntered: boolean
  noPicks: boolean
  filledFuture: number
  totalFuture: number
  filledAll: number
}

export function ProgressAdmin({ rows, totalMatches }: { rows: ProgressRow[]; totalMatches: number }) {
  const [copied, setCopied] = useState(false)
  const morosos = rows.filter((r) => r.neverEntered || r.filledFuture < r.totalFuture)
  const alDia = rows.length - morosos.length

  function copiar() {
    const lines = morosos.map((r) =>
      r.neverEntered
        ? `😴 ${r.display}: ¡ni ha entrado a la app!`
        : `⏰ ${r.display}: le faltan ${r.totalFuture - r.filledFuture} pronóstico(s)${r.noPicks ? ' y el campeón 👑' : ''}`
    )
    const txt = `🐔⚽ LA POLLA DE ALAMEDA — reporte de morosos:\n\n${lines.join('\n')}\n\n¡Pilas que los partidos se cierran al pitazo! 👉 pollamundialnatillera.vercel.app`
    navigator.clipboard.writeText(txt).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <section className="card mx-[18px] mb-4">
      <p className="display text-lg uppercase">Avance de pronósticos</p>
      <p className="text-xs font-bold mb-3" style={{ color: 'var(--muted)' }}>
        {alDia} al día ✅ · {morosos.length} en mora ⏰ — de {rows.length} parceros futboleros. Partidos por jugar: {rows[0]?.totalFuture ?? 0}.
      </p>

      {morosos.length > 0 && (
        <button className="savebtn mb-3" style={{ background: 'var(--red)' }} onClick={copiar}>
          {copied ? '✓ COPIADO — PÉGALO EN WHATSAPP' : '📋 COPIAR LISTA DE MOROSOS'}
        </button>
      )}

      <ul className="space-y-2">
        {rows.map((r) => {
          const pending = r.totalFuture - r.filledFuture
          const pct = r.totalFuture ? Math.round((r.filledFuture / r.totalFuture) * 100) : 0
          return (
            <li key={r.id} className="rounded-xl px-3 py-2" style={{ border: '2px solid var(--ink)', background: r.neverEntered ? '#FCE0DC' : pending === 0 ? '#E3F4E9' : 'var(--cream)' }}>
              <div className="flex items-center gap-2">
                <div className="av" style={{ width: 30, height: 30, fontSize: 16 }}>{avatarFor(r.display)}</div>
                <span className="flex-1 text-[13px] font-extrabold min-w-0 truncate">
                  {r.display}
                  {r.house && <span className="text-[10px] font-bold" style={{ color: 'var(--blue)' }}> 🏠{r.house}</span>}
                </span>
                <span className="text-[11px] font-extrabold whitespace-nowrap">
                  {r.neverEntered ? '😴 ni ha entrado' : pending === 0 ? '✅ al día' : `⏰ faltan ${pending}`}
                  {!r.neverEntered && r.noPicks && ' · sin 👑'}
                </span>
              </div>
              {!r.neverEntered && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ border: '1.5px solid var(--ink)', background: '#fff' }}>
                    <div className="h-full" style={{ width: `${pct}%`, background: pending === 0 ? 'var(--green)' : 'var(--yellow)' }} />
                  </div>
                  <span className="text-[10px] font-extrabold" style={{ color: 'var(--muted)' }}>
                    {r.filledFuture}/{r.totalFuture} · {r.filledAll}/{totalMatches} total
                  </span>
                </div>
              )}
            </li>
          )
        })}
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

// Plantilla Excel para los parceros análogos 📠
export function PlantillaAdmin() {
  return (
    <section className="card mx-[18px] mb-4">
      <p className="display text-lg uppercase">Plantilla Excel 📠</p>
      <p className="text-xs font-bold mb-3" style={{ color: 'var(--muted)' }}>
        Para el parcero que le tiene miedo a la app o que todavía imprime los correos 😂. Tiene los 104 partidos,
        calcula los puntos solo (fórmulas incluidas) y trae las reglas con todo y castigo. Se lo envías, lo llena
        y tú pasas sus pronósticos a la app.
      </p>
      <a href="/plantilla-polla.xlsx" download className="savebtn block text-center" style={{ textDecoration: 'none' }}>
        ⬇️ DESCARGAR PLANTILLA EXCEL
      </a>
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
