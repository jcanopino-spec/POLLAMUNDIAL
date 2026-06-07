'use client'

import { useActionState, useRef, useState } from 'react'
import { login } from './actions'
import { Confetti } from '@/components/Fiesta'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null)
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
        <div className="text-center px-6">
          <div className="flagline justify-center mt-2">
            <span style={{ background: 'var(--red)' }} />
            <span style={{ background: 'var(--green)' }} />
            <span style={{ background: 'var(--blue)' }} />
          </div>
          <div className="mascot bob">
            🐔<span className="ball">⚽</span>
          </div>
          <h1 className="display">
            <span className="a">La</span> <span className="b">Polla</span>
            <br />
            <span className="c">de Alameda</span>
          </h1>
          <div className="text-[13px] font-bold mt-2.5" style={{ color: 'var(--muted)' }}>
            Canadá · México · Estados Unidos
          </div>
          <div className="we">WE ARE 26 · MUNDIAL 2026</div>
        </div>

        <form action={action} className="card m-[18px] !rounded-3xl !border-[3px] !shadow-[0_8px_0_var(--ink)] !p-5">
          <p className="text-sm font-bold text-center mb-4">
            La gallina ya hizo su pronóstico 🐔
            <br />
            <b style={{ color: 'var(--red)' }}>¿Y tú a qué le tiras?</b>
          </p>
          <label className="flabel" htmlFor="name">Nombre</label>
          <input id="name" name="name" className="input" placeholder="¿Cómo te dicen?" autoComplete="username" required />
          <label className="flabel mt-4" style={{ marginTop: 16 }}>PIN · 4 dígitos</label>
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
          <button className="btn red mt-[18px]" disabled={pending || pin.some((d) => !d)} style={{ marginTop: 18 }}>
            {pending ? 'ENTRANDO…' : '¡A JUGAR! ⚽'}
          </button>
        </form>

        <p className="text-center text-xs font-bold px-6 pb-4" style={{ color: 'var(--muted)' }}>
          ¿Primera vez? El PIN de todos es <b style={{ color: 'var(--red)' }}>2026</b> 🎟️ — después lo cambias
        </p>
      </main>
    </div>
  )
}
