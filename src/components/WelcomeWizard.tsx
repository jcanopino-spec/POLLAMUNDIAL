'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { changePin } from '@/app/actions'
import PicksEditor from '@/components/PicksEditor'

type Props = {
  name: string
  mustChangePin: boolean
  picks: { finalist1: string | null; finalist2: string | null; champion: string | null }
  picksLocked: boolean
  openerLabel: string
  scoring: { exact: number; outcome: number; champion_bonus: number; finalist_bonus: number; winner_goals_bonus?: number }
}

export default function WelcomeWizard(p: Props) {
  const router = useRouter()
  const picksDone = !!(p.picks.finalist1 && p.picks.finalist2 && p.picks.champion)
  const needsPicks = !picksDone && !p.picksLocked
  // Primera vez: el PIN se cambia ANTES de seguir. Después vienen reglas y apuestas.
  const [step, setStep] = useState<'reglas' | 'pin' | 'picks'>(p.mustChangePin ? 'pin' : 'reglas')
  const [pinDone, setPinDone] = useState(!p.mustChangePin)

  function next() {
    if (step === 'pin') {
      setStep('reglas')
    } else if (step === 'reglas') {
      if (needsPicks) setStep('picks')
      else router.push('/?hola=1')
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
        <div className="we">MUNDIAL 2026 🏆</div>
      </div>

      {/* Pasos */}
      <div className="chips justify-center pt-4">
        {p.mustChangePin && <span className={`chip ${step === 'pin' ? 'on' : ''}`}>🔐 Tu PIN {pinDone && '✓'}</span>}
        <span className={`chip ${step === 'reglas' ? 'on' : ''}`}>📜 Reglas</span>
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
              <li>🥈 <b>¡NUEVO en fase de eliminación!</b> Si aciertas el <b>ganador</b> hay 3 formas de sumar (ejemplo en 16avos ×2): marcador exacto = <b style={{ color: 'var(--green)' }}>10</b>, acertar el <b>nº de goles del ganador</b> (sin ser exacto) = <b style={{ color: 'var(--green)' }}>8</b> (+{p.scoring.winner_goals_bonus ?? 2}), y solo el ganador = <b style={{ color: 'var(--green)' }}>6</b>.</li>
              <li>💰 Antes del pitazo inicial ({p.openerLabel}, hora Col) eliges tus <b>2 finalistas (+{p.scoring.finalist_bonus} c/u)</b> y tu <b>campeón (+{p.scoring.champion_bonus})</b>.</li>
              <li>🔮 ¿No sabes a quién apostarle? Usa el <b>Simulador</b> (pestaña 🔮): armas TU Mundial con el bracket real de la FIFA y compruebas que tu final <b>sí exista</b> — que no te pase que tus finalistas se maten en octavos 😅. Es opcional: si ya lo tienes claro, sáltalo y dale directo a pronosticar.</li>
              <li>📊 La tabla se actualiza solita. En eliminatorias cuenta el marcador con prórroga (los penales solo dicen quién pasa).</li>
              <li>🔐 Tu PIN inicial es <b>2026</b> — el mismo de TODO el barrio. Cámbialo ya mismo 🕵️.</li>
              <li>🏠 Tu casa también compite en la <b>guerra de casas</b>: tus puntos suman pa’ la tuya.</li>
              <li>🐷 El último del Mundial pone el <b>guaro</b> y el <b>cerdo de la porcícola</b>. Quedas avisado.</li>
              <li>📡 Soporte técnico: el admin atiende <b>desde los estadios del Mundial</b> (sí, él sí fue 😤✈️). Paciencia, que entre gol y gol también se administra.</li>
            </ol>
          </div>
          <Link href="/inplux" className="castigo" style={{ margin: 0, textDecoration: 'none' }}>
            <div className="big">😎</div>
            <div className="t">
              App <b>diseñada y donada por INPLUX SAS</b> a la natillera. ¿Quieres ver todo lo que hacemos?{' '}
              <b style={{ color: 'var(--yellow)' }}>Toca aquí 👉</b>
            </div>
          </Link>
          <button className="btn red" onClick={next}>
            {pinDone && !needsPicks ? '¡A PRONOSTICAR! ⚽' : 'LISTO, ME LAS SÉ 👌'}
          </button>
        </div>
      )}

      {step === 'pin' && <PinStep onDone={() => { setPinDone(true); next() }} />}

      {step === 'picks' && (
        <div className="pt-1">
          {/* Opción: probar primero en el simulador */}
          <div className="mx-[18px] mb-3 card !p-3" style={{ background: 'var(--cream-2)' }}>
            <p className="text-[12.5px] font-extrabold">🔮 ¿Todavía no sabes a quién apostarle?</p>
            <p className="text-[11px] font-bold mt-0.5 mb-2" style={{ color: 'var(--muted)' }}>
              Prueba primero el <b>Simulador</b>: arma tu Mundial con el bracket real y verifica que tu final
              sí exista. Tus apuestas te esperan aquí cuando vuelvas.
            </p>
            <Link href="/simulador" className="savebtn block text-center" style={{ background: 'var(--blue)', textDecoration: 'none' }}>
              🔮 PROBAR EN EL SIMULADOR PRIMERO
            </Link>
          </div>
          <p className="px-[18px] pb-3 text-xs font-bold" style={{ color: 'var(--muted)' }}>
            …o si ya lo tienes claro, séllala de una. Piénsalo bien… o no, igual nadie acierta 😄
          </p>
          <PicksEditor
            initial={p.picks}
            locked={p.picksLocked}
            finalistBonus={p.scoring.finalist_bonus}
            championBonus={p.scoring.champion_bonus}
            onSaved={() => setTimeout(() => router.push('/?hola=1'), 1200)}
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
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  function submit() {
    startTransition(async () => {
      const res = await changePin(pin, confirm)
      if (res?.error) setError(res.error)
      else {
        // Guardado en el registro ✓ — confirmación visible y seguimos
        setSaved(true)
        setTimeout(onDone, 1600)
      }
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

  if (saved) {
    return (
      <div className="px-[18px] pt-1">
        <div className="card text-center fade" style={{ background: '#E3F4E9' }}>
          <p className="text-4xl mb-2">🔒✅</p>
          <p className="display text-xl uppercase">¡PIN guardado!</p>
          <p className="text-[13px] font-bold mt-1" style={{ color: 'var(--muted)' }}>
            Quedó bajo llave en el registro. De ahora en adelante entras con TU PIN — el 2026 ya no sirve. Sigamos…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-[18px] pt-1 space-y-3">
      <div className="card space-y-3">
        <p className="display text-lg uppercase">🔐 Primero lo primero: tu PIN</p>
        <p className="text-[13px] font-bold leading-snug" style={{ color: 'var(--muted)' }}>
          Entraste con el PIN <b style={{ color: 'var(--ink)' }}>2026</b>, igual que el de todo el parche. Y tus
          parceros son capaces de entrar y pronosticarte un <b style={{ color: 'var(--red)' }}>Colombia 0–5
          Uzbekistán</b> 💀. Antes de seguir, pon uno nuevo de 4 dígitos y <b style={{ color: 'var(--ink)' }}>confírmalo
          dos veces</b>:
        </p>
        {input(pin, setPin, 'Nuevo PIN')}
        {input(confirm, setConfirm, 'Confírmalo otra vez')}
        {error && <p className="text-sm font-bold" style={{ color: 'var(--red-d)' }}>{error}</p>}
        {pin.length === 4 && confirm.length === 4 && pin !== confirm && (
          <p className="text-sm font-bold" style={{ color: 'var(--red-d)' }}>Los dos PIN no coinciden 🧐 — revísalos</p>
        )}
      </div>
      <button className="btn green" onClick={submit} disabled={pending || pin.length !== 4 || confirm.length !== 4 || pin !== confirm}>
        {pending ? 'GUARDANDO…' : 'VALIDAR Y GUARDAR MI PIN 🔒'}
      </button>
    </div>
  )
}
