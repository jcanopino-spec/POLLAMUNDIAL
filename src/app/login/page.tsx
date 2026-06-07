'use client'

import { useActionState } from 'react'
import { login } from './actions'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null)

  return (
    <main className="min-h-dvh flex items-center justify-center bg-gradient-to-b from-emerald-950 to-slate-950 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900/80 border border-emerald-800/40 p-8 shadow-2xl">
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
              PIN (4 dígitos) <span className="text-slate-500">— si es tu primera vez, es el número de tu casa 🏠</span>
            </label>
            <input
              id="pin" name="pin" type="password" inputMode="numeric" pattern="\d{4}" maxLength={4} required
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white tracking-[0.5em] text-center focus:outline-none focus:border-emerald-500"
            />
          </div>
          {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}
          <button
            disabled={pending}
            className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2.5 transition"
          >
            {pending ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  )
}
