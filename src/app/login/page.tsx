'use client'

import { useActionState } from 'react'
import { login } from './actions'
import { Confetti } from '@/components/Fiesta'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null)

  return (
    <main className="min-h-dvh flex items-center justify-center p-4 relative">
      <Confetti />
      <div className="w-full max-w-sm rounded-2xl bg-slate-900/85 backdrop-blur border border-emerald-700/40 p-8 shadow-2xl shadow-emerald-900/40 relative z-[1]">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🫎 🐆 🦅</div>
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-red-400 via-emerald-400 to-sky-400 bg-clip-text text-transparent">
            Polla Mundial 2026
          </h1>
          <p className="text-emerald-400/80 text-sm mt-1">Canadá · México · Estados Unidos · WE ARE 26</p>
          <p className="text-slate-500 text-xs mt-2 italic">Maple, Zayu y Clutch ya hicieron sus pronósticos. ¿Y tú?</p>
        </div>
        <form action={action} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm text-slate-300 mb-1">Nombre</label>
            <input
              id="name" name="name" autoComplete="username" required
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label htmlFor="pin" className="block text-sm text-slate-300 mb-1">
              PIN (4 dígitos) <span className="text-slate-500">— ¿primera vez? prueba con 2026 🤫</span>
            </label>
            <input
              id="pin" name="pin" type="password" inputMode="numeric" pattern="\d{4}" maxLength={4} required
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white tracking-[0.5em] text-center focus:outline-none focus:border-emerald-500"
            />
          </div>
          {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}
          <button
            disabled={pending}
            className="w-full rounded-lg bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 disabled:opacity-50 text-white font-semibold py-2.5 transition shadow-lg shadow-emerald-900/50"
          >
            {pending ? 'Entrando…' : '¡A jugar! ⚽'}
          </button>
        </form>
      </div>
    </main>
  )
}
