'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { changePin } from '@/app/actions'
import PicksEditor from '@/components/PicksEditor'

type Props = {
  name: string
  mustChangePin: boolean
  picks: { finalist1: string | null; finalist2: string | null; champion: string | null }
  picksLocked: boolean
  openerLabel: string
  scoring: { exact: number; outcome: number; champion_bonus: number; finalist_bonus: number }
}

const MASCOTAS = [
  { emoji: '🫎', nombre: 'Maple', pais: 'Canadá', frase: 'El alce que no perdona un pronóstico tarde.' },
  { emoji: '🐆', nombre: 'Zayu', pais: 'México', frase: 'El jaguar que ya sabe quién va a quedar de último.' },
  { emoji: '🦅', nombre: 'Clutch', pais: 'EE. UU.', frase: 'El águila que ve TODO… hasta tus 0 puntos.' },
]

export default function WelcomeWizard(p: Props) {
  const router = useRouter()
  const picksDone = !!(p.picks.finalist1 && p.picks.finalist2 && p.picks.champion)
  const needsPicks = !picksDone && !p.picksLocked
  const [step, setStep] = useState<'reglas' | 'pin' | 'picks'>('reglas')
  const [pinDone, setPinDone] = useState(!p.mustChangePin)

  function next() {
    if (step === 'reglas') {
      if (!pinDone) setStep('pin')
      else if (needsPicks) setStep('picks')
      else router.push('/')
    } else if (step === 'pin') {
      if (needsPicks) setStep('picks')
      else router.push('/')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Mascotas */}
      <div className="text-center mb-6">
        <div className="text-5xl tracking-wide">🫎 🐆 🦅</div>
        <h1 className="text-2xl font-extrabold mt-2 bg-gradient-to-r from-red-400 via-emerald-400 to-sky-400 bg-clip-text text-transparent">
          ¡Bienvenido a la Polla, {p.name}!
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Mundial 2026 · Canadá, México y Estados Unidos · <span className="font-semibold text-slate-300">WE ARE 26</span>
        </p>
      </div>

      {/* Pasos */}
      <div className="flex justify-center gap-2 mb-6 text-xs">
        {[
          ['reglas', '📜 Reglas'],
          ...(p.mustChangePin ? [['pin', '🔐 Tu PIN']] : []),
          ...(needsPicks || picksDone ? [['picks', '💰 Apuestas']] : []),
        ].map(([key, label]) => (
          <span
            key={key}
            className={`px-3 py-1 rounded-full border ${
              step === key ? 'border-emerald-400 text-emerald-300 bg-emerald-950/40' : 'border-slate-800 text-slate-500'
            }`}
          >
            {label}
          </span>
        ))}
      </div>

      {step === 'reglas' && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-2">
            {MASCOTAS.map((m) => (
              <div key={m.nombre} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-center">
                <div className="text-3xl">{m.emoji}</div>
                <div className="font-bold text-sm mt-1">{m.nombre} <span className="text-slate-500 font-normal">· {m.pais}</span></div>
                <div className="text-xs text-slate-400 mt-1">{m.frase}</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 text-sm">
            <h2 className="font-bold text-base">📜 Las reglas del juego (léelas, que después no valen reclamos)</h2>
            <ol className="space-y-2.5 list-none">
              <li>🔮 <strong>Pronostica el marcador</strong> de los 104 partidos. Puedes cambiar tu pronóstico las veces que quieras… <strong>hasta que el árbitro pite</strong>. Después no hay nada que hacer: ni llorando, ni con tutela, ni "es que se me cayó el internet".</li>
              <li>🎯 <strong>Marcador exacto = {p.scoring.exact} pts.</strong> ✔️ Acertar solo quién gana (o el empate) = <strong>{p.scoring.outcome} pts.</strong></li>
              <li>📈 Entre más avanza el Mundial, más vale el acierto: 16avos <strong>×2</strong>, octavos <strong>×3</strong>, cuartos <strong>×4</strong>, semis <strong>×5</strong> y la final <strong>×6</strong>. Un exacto en la final son <strong>{p.scoring.exact * 6} puntazos</strong>.</li>
              <li>💰 Antes del pitazo inicial ({p.openerLabel}, hora colombiana) eliges tus <strong>2 finalistas ({p.scoring.finalist_bonus} pts cada uno)</strong> y de esos dos, tu <strong>campeón ({p.scoring.champion_bonus} pts)</strong>.</li>
              <li>📊 La tabla de posiciones se actualiza solita al terminar cada partido. En eliminatorias cuenta el marcador final con prórroga (los penales solo definen quién pasa, no tu marcador).</li>
              <li>🏠 Tu PIN inicial es <strong>el número de tu casa</strong>… o sea que medio barrio lo conoce. Por eso te lo hacemos cambiar ya mismo 🕵️.</li>
              <li>🏆 El que gana se lleva la gloria (y lo que diga la junta de la natillera). El último… que vaya pensando el sancocho 😂</li>
            </ol>
          </div>

          <button onClick={next} className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 transition">
            {pinDone && !needsPicks ? '¡A pronosticar! ⚽' : 'Listo, me las sé 👌'}
          </button>
        </div>
      )}

      {step === 'pin' && <PinStep onDone={() => { setPinDone(true); next() }} />}

      {step === 'picks' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="font-bold mb-1">💰 Las apuestas grandes</h2>
          <p className="text-xs text-slate-400 mb-4">Sin esto no puedes empezar a pronosticar. Piénsalo bien… o no, igual nadie acierta 😄</p>
          <PicksEditor
            initial={p.picks}
            locked={p.picksLocked}
            finalistBonus={p.scoring.finalist_bonus}
            championBonus={p.scoring.champion_bonus}
            onSaved={() => setTimeout(() => router.push('/'), 1200)}
          />
        </div>
      )}
    </div>
  )
}

function PinStep({ onDone }: { onDone: () => void }) {
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function submit() {
    startTransition(async () => {
      const res = await changePin(pin, confirm)
      if (res?.error) setError(res.error)
      else onDone()
    })
  }

  const input = (v: string, set: (s: string) => void, ph: string) => (
    <input
      type="password"
      inputMode="numeric"
      pattern="\d{4}"
      maxLength={4}
      value={v}
      placeholder={ph}
      onChange={(e) => { set(e.target.value); setError('') }}
      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2.5 text-white tracking-[0.5em] text-center focus:outline-none focus:border-emerald-500"
    />
  )

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
      <h2 className="font-bold">🔐 Cambia tu PIN</h2>
      <p className="text-sm text-slate-400">
        Tu PIN actual es el número de tu casa. Tus vecinos también juegan esta polla… y son capaces de pronosticar
        por ti un Colombia 0 – 5 Uzbekistán 💀. Pon uno nuevo de 4 dígitos:
      </p>
      {input(pin, setPin, 'Nuevo PIN')}
      {input(confirm, setConfirm, 'Repítelo')}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        onClick={submit}
        disabled={pending || pin.length !== 4 || confirm.length !== 4}
        className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold py-2.5 transition"
      >
        {pending ? 'Guardando…' : 'Guardar mi PIN nuevo'}
      </button>
    </div>
  )
}
