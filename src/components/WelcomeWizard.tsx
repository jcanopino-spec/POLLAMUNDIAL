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
    <div className="fade">
      {/* Cabecera con la gallina */}
      <div className="text-center px-6 pt-4">
        <div className="flagline justify-center">
          <span style={{ background: 'var(--red)' }} />
          <span style={{ background: 'var(--green)' }} />
          <span style={{ background: 'var(--blue)' }} />
        </div>
        <div className="mascot bob" style={{ width: 96, height: 96, fontSize: 52 }}>
          🐔<span className="ball">⚽</span>
        </div>
        <h1 className="display text-3xl uppercase leading-none">
          ¡Bienvenido, <span style={{ color: 'var(--green)' }}>{p.name}</span>!
        </h1>
        <div className="we">WE ARE 26 · MUNDIAL 2026</div>
      </div>

      {/* Pasos */}
      <div className="chips justify-center pt-4">
        <span className={`chip ${step === 'reglas' ? 'on' : ''}`}>📜 Reglas</span>
        {p.mustChangePin && <span className={`chip ${step === 'pin' ? 'on' : ''}`}>🔐 Tu PIN</span>}
        {(needsPicks || picksDone) && <span className={`chip ${step === 'picks' ? 'on' : ''}`}>💰 Apuestas</span>}
      </div>

      {step === 'reglas' && (
        <div className="px-[18px] space-y-3 pt-1">
          <div className="card">
            <p className="display text-lg uppercase mb-2">📜 Las reglas (después no valen reclamos)</p>
            <ol className="space-y-2.5 text-[13px] font-bold leading-snug">
              <li>🔮 Pronostica el marcador de los <b>104 partidos</b>. Cámbialo las veces que quieras… <b>hasta que pite el árbitro</b>. Después ni llorando, ni con tutela, ni “se me cayó el internet”.</li>
              <li>🎯 Marcador exacto = <b style={{ color: 'var(--green)' }}>{p.scoring.exact} pts</b> · ✔️ acertar quién gana (o empate) = <b style={{ color: 'var(--green)' }}>{p.scoring.outcome} pts</b>.</li>
              <li>📈 Entre más avanza, más vale: 16avos <b>×2</b>, octavos <b>×3</b>, cuartos <b>×4</b>, semis <b>×5</b>, final <b>×6</b>. Un exacto en la final son <b style={{ color: 'var(--red)' }}>{p.scoring.exact * 6} puntazos</b>.</li>
              <li>💰 Antes del pitazo inicial ({p.openerLabel}, hora Col) eliges tus <b>2 finalistas (+{p.scoring.finalist_bonus} c/u)</b> y tu <b>campeón (+{p.scoring.champion_bonus})</b>.</li>
              <li>📊 La tabla se actualiza solita. En eliminatorias cuenta el marcador con prórroga (los penales solo dicen quién pasa).</li>
              <li>🔐 Tu PIN inicial es <b>2026</b> — el mismo de TODO el barrio. Cámbialo ya mismo 🕵️.</li>
              <li>🏠 Tu casa también compite en la <b>guerra de casas</b>: tus puntos suman pa’ la tuya.</li>
              <li>🐷 El último del Mundial pone el <b>guaro</b> y el <b>cerdo de la porcícola</b>. Quedas avisado.</li>
              <li>📡 Soporte técnico: el admin atiende <b>desde los estadios del Mundial</b> (sí, él sí fue 😤✈️). Paciencia, que entre gol y gol también se administra.</li>
            </ol>
          </div>
          <div className="castigo" style={{ margin: 0 }}>
            <div className="big">😎</div>
            <div className="t">
              App diseñada por <b>Jcanopino · CEO INPLUX SAS</b>. Prohibido copiarla sin permiso:
              la gallina tiene abogados 🐔⚖️
            </div>
          </div>
          <button className="btn red" onClick={next}>
            {pinDone && !needsPicks ? '¡A PRONOSTICAR! ⚽' : 'LISTO, ME LAS SÉ 👌'}
          </button>
        </div>
      )}

      {step === 'pin' && <PinStep onDone={() => { setPinDone(true); next() }} />}

      {step === 'picks' && (
        <div className="pt-1">
          <p className="px-[18px] pb-3 text-xs font-bold" style={{ color: 'var(--muted)' }}>
            Sin esto no arrancas. Piénsalo bien… o no, igual nadie acierta 😄
          </p>
          <PicksEditor
            initial={p.picks}
            locked={p.picksLocked}
            finalistBonus={p.scoring.finalist_bonus}
            championBonus={p.scoring.champion_bonus}
            onSaved={() => setTimeout(() => router.push('/'), 1200)}
          />
        </div>
      )}
      <div className="spacer" />
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
      onChange={(e) => { set(e.target.value.replace(/\D/g, '')); setError('') }}
      className="input text-center"
      style={{ letterSpacing: '0.5em', fontFamily: 'var(--font-anton)', fontSize: 24 }}
    />
  )

  return (
    <div className="px-[18px] pt-1 space-y-3">
      <div className="card space-y-3">
        <p className="display text-lg uppercase">🔐 Cambia tu PIN</p>
        <p className="text-[13px] font-bold leading-snug" style={{ color: 'var(--muted)' }}>
          Tu PIN es <b style={{ color: 'var(--ink)' }}>2026</b>, igual que el de todos tus vecinos. Y tus vecinos son
          capaces de entrar y pronosticarte un <b style={{ color: 'var(--red)' }}>Colombia 0–5 Uzbekistán</b> 💀. Pon
          uno nuevo, solo tuyo:
        </p>
        {input(pin, setPin, 'Nuevo PIN')}
        {input(confirm, setConfirm, 'Repítelo')}
        {error && <p className="text-sm font-bold" style={{ color: 'var(--red-d)' }}>{error}</p>}
      </div>
      <button className="btn green" onClick={submit} disabled={pending || pin.length !== 4 || confirm.length !== 4}>
        {pending ? 'GUARDANDO…' : 'GUARDAR MI PIN NUEVO 🔒'}
      </button>
    </div>
  )
}
