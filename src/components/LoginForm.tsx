'use client'

import Image from 'next/image'
import { useActionState, useRef, useState } from 'react'
import { login } from '@/app/login/actions'
import { Confetti } from '@/components/Fiesta'
import { avatarFor } from '@/lib/avatar'

export type Vecino = { name: string; nickname: string | null; house: string | null; firstTime: boolean }

export default function LoginForm({ vecinos }: { vecinos: Vecino[] }) {
  const [state, action, pending] = useActionState(login, null)
  const [selected, setSelected] = useState<Vecino | null>(null)
  const [pin, setPin] = useState(['', '', '', ''])
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  const setDigit = (i: number, v: string) => {
    const d = v.replace(/\D/g, '').slice(-1)
    const np = [...pin]
    np[i] = d
    setPin(np)
    if (d && i < 3) refs[i + 1].current?.focus()
  }
  const onKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[i] && i > 0) refs[i - 1].current?.focus()
  }

  return (
    <div className="shell">
      <Confetti />
      <main className="login fade flex-1 flex flex-col justify-center py-6 relative z-[1]">
        <div className="text-center">
          {/* Portada oficial de la Natillera Alameda */}
          <div className="mx-[14px] overflow-hidden rounded-3xl" style={{ border: '3px solid var(--ink)', boxShadow: '0 6px 0 var(--ink)' }}>
            <Image src="/portada.jpg" alt="Natillera Alameda — pasión que nos une, sabor que nos representa" width={960} height={639} priority className="w-full h-auto" />
          </div>
          <div className="we gold-ribbon" style={{ marginTop: 14 }}>
            <span className="trophy-float">🏆</span> LA POLLA DE ALAMEDA · MUNDIAL 2026 <span className="trophy-float">🏆</span>
          </div>
        </div>

        <form action={action} className="card m-[18px] !rounded-3xl !border-[3px] !shadow-[0_8px_0_var(--ink)] !p-5">
          {!selected && (
            <p className="text-sm font-bold text-center mb-4">
              La gallina ya hizo su pronóstico 🐔
              <br />
              <b style={{ color: 'var(--red)' }}>¿Y tú a qué le tiras?</b>
            </p>
          )}

          <label className="flabel" htmlFor="vecino">¿Quién eres?</label>
          <select
            id="vecino"
            className="input"
            required
            value={selected?.name ?? ''}
            onChange={(e) => setSelected(vecinos.find((v) => v.name === e.target.value) ?? null)}
          >
            <option value="" disabled>— Busca tu apodo, parcero —</option>
            {vecinos.map((v) => (
              <option key={v.name} value={v.name}>
                {v.nickname || v.name}{v.house ? ` · Casa ${v.house}` : ''}
              </option>
            ))}
          </select>
          <input type="hidden" name="name" value={selected?.name ?? ''} />

          {/* Bienvenida al elegir su apodo */}
          {selected && (
            <div
              className="mt-3 rounded-2xl px-3 py-2.5 text-center fade"
              style={{ border: '2.5px solid var(--ink)', background: 'var(--yellow)' }}
            >
              <p className="text-sm font-extrabold">
                ¡Qué hubo, {selected.nickname || selected.name}! {avatarFor(selected.nickname || selected.name)}
              </p>
              <p className="text-[11px] font-bold">
                {selected.name} · 🏠 Casa {selected.house ?? '—'}
              </p>
              {selected.firstTime && (
                <p className="text-[11px] font-extrabold mt-0.5" style={{ color: 'var(--red-d)' }}>
                  Primera vez: tu PIN es 2026 🎟️
                </p>
              )}
            </div>
          )}

          <label className="flabel" style={{ marginTop: 16 }}>PIN · 4 dígitos</label>
          <div className="pinrow">
            {pin.map((d, i) => (
              <input
                key={i}
                ref={refs[i]}
                className={d ? 'filled' : ''}
                inputMode="numeric"
                type="password"
                value={d}
                aria-label={`Dígito ${i + 1} del PIN`}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => onKey(i, e)}
              />
            ))}
          </div>
          <input type="hidden" name="pin" value={pin.join('')} />
          {state?.error && (
            <p className="text-sm font-bold text-center mt-3" style={{ color: 'var(--red-d)' }}>{state.error}</p>
          )}
          <button className="btn red" disabled={pending || pin.some((d) => !d) || !selected} style={{ marginTop: 18 }}>
            {pending ? 'ENTRANDO…' : '¡A JUGAR! ⚽'}
          </button>
        </form>

        <p className="text-center text-xs font-bold px-6 pb-3" style={{ color: 'var(--muted)' }}>
          ¿Primera vez? El PIN de todos es <b style={{ color: 'var(--red)' }}>2026</b> 🎟️ — al entrar pones el tuyo
        </p>

        {/* Créditos del diseñador → vitrina INPLUX */}
        <a href="/inplux" className="block mx-[18px] mb-5 rounded-2xl px-4 py-3 text-center" style={{ background: 'var(--ink)', color: 'var(--cream)', textDecoration: 'none' }}>
          <p className="text-[11px] font-extrabold">
            Diseñada y donada por <span style={{ color: 'var(--yellow)' }}>INPLUX SAS</span> 😎
          </p>
          <p className="text-[10px] font-bold mt-1" style={{ color: '#cbbfae' }}>
            Administrada EN VIVO 📡 desde los estadios del Mundial — el único del parche que sí va ✈️🏟️
          </p>
          <p className="text-[10px] font-extrabold mt-1.5" style={{ color: 'var(--yellow)' }}>
            👉 Mira todo lo que hacemos (toca aquí)
          </p>
        </a>
      </main>
    </div>
  )
}
