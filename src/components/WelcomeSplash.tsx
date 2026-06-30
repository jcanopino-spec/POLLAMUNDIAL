'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Confetti } from '@/components/Fiesta'
import { avatarFor } from '@/lib/avatar'

// Frase extra determinista por vecino (que a cada uno le toque la suya)
const QUIPS = [
  'El VAR de esta polla es la gallina y no acepta reclamos 🐔',
  'Pronosticar 5–0 de Curazao también es válido… pero te grabamos 😂',
  'Aquí el único offside es no pagar la natillera 💸',
  'Si aciertas la final te hacemos estatua en la portería del conjunto 🗿',
  'Tu suegra también pronostica mejor que tú. Demuestra lo contrario 😏',
  'Prohibido cambiar de equipo a mitad de Mundial, eso es de tibios 🙄',
  'El que gane invita… y el que pierda PAGA 🐷',
  'Dicen que la casa 2026 entrena pronósticos de noche 👀',
]

export default function WelcomeSplash({ apodo, guest = false }: { apodo: string; guest?: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(true)
  if (!open) return null

  if (guest) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-5" style={{ background: 'rgba(21, 17, 10, .85)' }}>
        <Confetti />
        <div className="card !rounded-3xl !border-[3px] !shadow-[0_8px_0_var(--ink)] w-full max-w-sm text-center fade relative z-[1]">
          <div className="text-3xl mb-1">👀🍿</div>
          <div className="mascot bob" style={{ width: 84, height: 84, fontSize: 46 }}>🕵️<span className="ball">⚽</span></div>
          <p className="display text-2xl uppercase leading-none">¡Quihubo, <span style={{ color: 'var(--red)' }}>METIDO</span>!</p>
          <p className="text-xs font-bold mt-1" style={{ color: 'var(--muted)' }}>
            Entraste como <b>INVITADO</b> 👀 (sí, te estamos viendo).
          </p>

          <div className="space-y-2 mt-3 text-left">
            <div className="flex items-center gap-2.5 rounded-xl px-3 py-2" style={{ border: '2px solid var(--ink)', background: 'var(--cream)' }}>
              <span className="text-xl">🔍</span>
              <p className="text-[12.5px] font-extrabold leading-tight">Puedes <b>chismosear TODO</b>: la tabla del cerdo, el camino a la final, los goleadores… y los ridículos ajenos 😂</p>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl px-3 py-2" style={{ border: '2px solid var(--ink)', background: 'var(--cream)' }}>
              <span className="text-xl">🚫</span>
              <p className="text-[12.5px] font-extrabold leading-tight">Pero <b>NO juegas ni puntúas</b>, papá. De colado no se cobra premio 🐷</p>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl px-3 py-2" style={{ border: '2px solid var(--ink)', background: 'var(--yellow)' }}>
              <span className="text-xl">🏆</span>
              <p className="text-[12.5px] font-extrabold leading-tight">¿Te picó el bichito? <b>Arma TU propia polla</b> con tu parche… si te atreves 💪</p>
            </div>
          </div>

          <p className="text-[11px] font-bold mt-3 px-1" style={{ color: 'var(--muted)' }}>
            🦅 MFito: “Mira, aprende y copia… pero la corona es nuestra.” · 🐷 Cerdiño: “El que mira y no juega, igual paga el cerdo de la curiosidad.”
          </p>

          <button className="btn red mt-4" onClick={() => { setOpen(false); router.replace('/') }}>
            ¡A CHISMOSEAR! 🍿
          </button>
        </div>
      </div>
    )
  }

  let h = 0
  for (const ch of apodo) h = (h * 31 + ch.charCodeAt(0)) % 997
  const quip = QUIPS[h % QUIPS.length]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: 'rgba(21, 17, 10, .82)' }}
    >
      <Confetti />
      <div className="card !rounded-3xl !border-[3px] !shadow-[0_8px_0_var(--ink)] w-full max-w-sm text-center fade relative z-[1]">
        <div className="text-3xl mb-1"><span className="trophy-float">🏆</span></div>
        <div className="mascot bob" style={{ width: 84, height: 84, fontSize: 46 }}>
          {avatarFor(apodo)}
          <span className="ball">⚽</span>
        </div>
        <p className="display text-2xl uppercase leading-none">
          ¡Llegaste, <span style={{ color: 'var(--green)' }}>{apodo}</span>!
        </p>
        <p className="text-xs font-bold mt-1" style={{ color: 'var(--muted)' }}>
          Bienvenido a la fiesta. Aquí venimos a 3 cosas:
        </p>

        <div className="space-y-2 mt-3 text-left">
          <div className="flex items-center gap-2.5 rounded-xl px-3 py-2" style={{ border: '2px solid var(--ink)', background: 'var(--cream)' }}>
            <span className="text-xl">⚽</span>
            <p className="text-[12.5px] font-extrabold leading-tight">Gozarnos el Mundial como si Colombia jugara la final</p>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl px-3 py-2" style={{ border: '2px solid var(--ink)', background: 'var(--cream)' }}>
            <span className="text-xl">😂</span>
            <p className="text-[12.5px] font-extrabold leading-tight">Reírnos (con respeto… bueno, no tanto) de los pronósticos ajenos</p>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl px-3 py-2" style={{ border: '2px solid var(--ink)', background: 'var(--yellow)' }}>
            <span className="text-xl">💰</span>
            <p className="text-[12.5px] font-extrabold leading-tight">Recoger billetico pa’ los fondos de la natillera 🤑</p>
          </div>
        </div>

        <p className="text-[11px] font-bold mt-3 px-1" style={{ color: 'var(--muted)' }}>{quip}</p>

        <button
          className="btn red mt-4"
          onClick={() => {
            setOpen(false)
            router.replace('/')
          }}
        >
          ¡A GOZARLA! 🎉
        </button>
      </div>
    </div>
  )
}
