'use client'

import { useState, useTransition } from 'react'
import { savePicks } from '@/app/actions'
import { ALL_TEAMS, teamFlag, teamShort } from '@/lib/teams'

type Props = {
  initial: { finalist1: string | null; finalist2: string | null; champion: string | null }
  locked: boolean
  finalistBonus: number
  championBonus: number
  onSaved?: () => void
}

export default function PicksEditor({ initial, locked, finalistBonus, championBonus, onSaved }: Props) {
  const confirmedAtStart = !!(initial.finalist1 && initial.finalist2 && initial.champion)
  const [saved, setSaved] = useState<{ finalists: string[]; champion: string } | null>(
    confirmedAtStart ? { finalists: [initial.finalist1!, initial.finalist2!], champion: initial.champion! } : null
  )
  const [finalists, setFinalists] = useState<string[]>(
    [initial.finalist1, initial.finalist2].filter(Boolean) as string[]
  )
  const [champion, setChampion] = useState(initial.champion)
  // Confirmado → modo lectura; sin guardar o tras tocar Modificar → modo edición
  const [editing, setEditing] = useState(!confirmedAtStart)
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  function toggleFinalist(team: string) {
    if (locked || !editing) return
    setMsg(null)
    setFinalists((prev) => {
      if (prev.includes(team)) {
        if (champion === team) setChampion(null)
        return prev.filter((t) => t !== team)
      }
      if (prev.length >= 2) return [prev[1], team]
      return [...prev, team]
    })
  }

  function confirmar() {
    if (locked || finalists.length !== 2 || !champion) return
    startTransition(async () => {
      const res = await savePicks(finalists[0], finalists[1], champion)
      if (res?.error) setMsg({ text: res.error })
      else {
        setSaved({ finalists: [...finalists], champion })
        setEditing(false)
        setMsg({ ok: true, text: '✓ ¡Apuestas confirmadas! Que la gallina te acompañe 🐔' })
        onSaved?.()
      }
    })
  }

  function modificar() {
    if (locked) return
    setMsg(null)
    setEditing(true)
  }

  function cancelar() {
    if (!saved) return
    setFinalists([...saved.finalists])
    setChampion(saved.champion)
    setMsg(null)
    setEditing(false)
  }

  // ---------- MODO LECTURA: confirmado y bloqueado a toques ----------
  if (!editing && saved) {
    return (
      <div className="px-[18px] space-y-3">
        <div className="card" style={{ background: '#E3F4E9' }}>
          <p className="kicker mb-2" style={{ color: 'var(--green)' }}>✓ Tus apuestas grandes están confirmadas</p>
          <div className="space-y-1.5 text-sm font-extrabold">
            <p>🏁 Finalistas: {teamFlag(saved.finalists[0])} {teamShort(saved.finalists[0])} · {teamFlag(saved.finalists[1])} {teamShort(saved.finalists[1])}</p>
            <p>👑 Campeón: {teamFlag(saved.champion)} {teamShort(saved.champion)}</p>
          </div>
        </div>
        {locked ? (
          <p className="text-xs font-bold text-center" style={{ color: 'var(--muted)' }}>
            ⛔ El Mundial ya comenzó: quedaron selladas. Ya no se pueden tocar 🔒
          </p>
        ) : (
          <>
            <button className="btn ghost" onClick={modificar}>✏️ MODIFICAR MIS APUESTAS</button>
            <p className="text-[11px] font-bold text-center" style={{ color: 'var(--muted)' }}>
              Puedes cambiarlas las veces que quieras hasta el pitazo inicial. Después, la gallina 🐔 no negocia.
            </p>
          </>
        )}
      </div>
    )
  }

  // ---------- MODO EDICIÓN ----------
  return (
    <div className="px-[18px] space-y-5">
      <div>
        <p className="kicker mb-1" style={{ color: 'var(--green)' }}>
          1️⃣ Tus dos finalistas · {finalistBonus} pts c/u
        </p>
        <p className="text-xs font-bold mb-2" style={{ color: 'var(--muted)' }}>
          Los dos que según tú llegan a la final. Toca para elegir (máx. 2).
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {ALL_TEAMS.map((t) => {
            const on = finalists.includes(t)
            return (
              <button
                key={t}
                onClick={() => toggleFinalist(t)}
                disabled={locked}
                className="text-left text-[13px] font-extrabold rounded-xl px-2.5 py-2 transition disabled:opacity-50"
                style={{
                  border: '2.5px solid var(--ink)',
                  background: on ? 'var(--green)' : 'var(--paper)',
                  color: on ? '#fff' : 'var(--ink)',
                  boxShadow: on ? '0 3px 0 var(--ink)' : 'none',
                }}
              >
                {teamFlag(t)} {teamShort(t)}
              </button>
            )
          })}
        </div>
      </div>

      {finalists.length === 2 && (
        <div>
          <p className="kicker mb-2" style={{ color: 'var(--green)' }}>
            2️⃣ Y de esos dos, tu campeón · {championBonus} pts
          </p>
          <div className="grid grid-cols-2 gap-2">
            {finalists.map((t) => {
              const on = champion === t
              return (
                <button
                  key={t}
                  onClick={() => !locked && (setChampion(t), setMsg(null))}
                  disabled={locked}
                  className="display text-base uppercase rounded-2xl px-3 py-4 text-center transition disabled:opacity-50"
                  style={{
                    border: '3px solid var(--ink)',
                    background: on ? 'var(--yellow)' : 'var(--paper)',
                    boxShadow: on ? '0 5px 0 var(--ink)' : 'none',
                  }}
                >
                  {on && '👑 '}
                  {teamFlag(t)} {teamShort(t)}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {msg && (
          <p className="text-sm font-bold text-center" style={{ color: msg.ok ? 'var(--green)' : 'var(--red-d)' }}>
            {msg.text}
          </p>
        )}
        {!locked ? (
          <>
            <button className="btn green" onClick={confirmar} disabled={pending || finalists.length !== 2 || !champion}>
              {pending ? 'GUARDANDO…' : finalists.length !== 2 ? 'ELIGE TUS 2 FINALISTAS' : !champion ? 'CORONA A TU CAMPEÓN 👑' : '✓ CONFIRMAR APUESTAS 💰'}
            </button>
            {saved && (
              <button className="btn ghost" onClick={cancelar} disabled={pending}>✕ CANCELAR CAMBIOS</button>
            )}
          </>
        ) : (
          <p className="text-xs font-bold text-center" style={{ color: 'var(--muted)' }}>
            ⛔ El Mundial ya comenzó: estas apuestas quedaron selladas.
          </p>
        )}
      </div>
    </div>
  )
}
