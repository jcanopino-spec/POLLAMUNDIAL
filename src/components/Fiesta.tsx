'use client'

import { useEffect, useState } from 'react'

// Confeti de papelitos (colores del diseño). Posiciones deterministas:
// nada de Math.random en render, que rompe la hidratación.
const COLS = ['#E1382F', '#1B9150', '#3447D6', '#FFC22E', '#ffffff']
const PIECES = Array.from({ length: 18 }, (_, i) => ({
  l: (i * 53 + 7) % 100,
  d: 9 + ((i * 37) % 70) / 10,
  delay: (i * 13) % 9,
  r: (i * 47) % 360,
  c: COLS[i % COLS.length],
}))

export function Confetti({ density = 1 }: { density?: 0.5 | 1 }) {
  const pieces = density === 1 ? PIECES : PIECES.filter((_, i) => i % 2 === 0)
  return (
    <div aria-hidden className="confetti-wrap">
      {pieces.map((p, i) => (
        <i
          key={i}
          style={{
            left: `${p.l}%`,
            background: p.c,
            animationDuration: `${p.d}s`,
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.r}deg)`,
          }}
        />
      ))}
    </div>
  )
}

// Cuenta regresiva al próximo partido (o al pitazo inaugural)
export function Countdown({ targetIso, label }: { targetIso: string; label: string }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  if (now == null) return <span className="display text-lg">…</span>

  const diff = Math.max(0, new Date(targetIso).getTime() - now)
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="text-center">
      <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: 'var(--yellow)' }}>
        {label}
      </p>
      <p className="display text-2xl mt-0.5">
        {diff === 0 ? '¡RUEDA EL BALÓN! ⚽' : d > 0 ? `${d}d ${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}:${pad(s)}`}
      </p>
    </div>
  )
}
