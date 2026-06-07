'use client'

import { useEffect, useState } from 'react'

// Posiciones deterministas (nada de Math.random en render: rompe la hidratación)
const PIECES = [
  { e: '⚽', l: 4, d: 11, delay: 0 }, { e: '🎉', l: 12, d: 13, delay: 2 },
  { e: '🟡', l: 20, d: 10, delay: 5 }, { e: '🏆', l: 28, d: 14, delay: 1 },
  { e: '🔵', l: 36, d: 12, delay: 7 }, { e: '🎊', l: 44, d: 11, delay: 3 },
  { e: '🔴', l: 52, d: 13, delay: 6 }, { e: '⚽', l: 60, d: 10, delay: 4 },
  { e: '🟢', l: 68, d: 14, delay: 8 }, { e: '🥳', l: 76, d: 12, delay: 2 },
  { e: '🎉', l: 84, d: 11, delay: 9 }, { e: '⭐', l: 92, d: 13, delay: 5 },
] as const

export function Confetti({ density = 1 }: { density?: 0.5 | 1 }) {
  const pieces = density === 1 ? PIECES : PIECES.filter((_, i) => i % 2 === 0)
  return (
    <div aria-hidden className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti text-xl"
          style={{ left: `${p.l}%`, animationDuration: `${p.d}s`, animationDelay: `${p.delay}s` }}
        >
          {p.e}
        </span>
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

  if (now == null) return <span className="font-mono text-lg">…</span>

  const diff = Math.max(0, new Date(targetIso).getTime() - now)
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="text-center">
      <p className="text-[11px] uppercase tracking-widest text-emerald-200/80">{label}</p>
      <p className="font-mono text-2xl font-bold text-white mt-0.5">
        {diff === 0 ? '¡YA RUEDA EL BALÓN! ⚽' : d > 0 ? `${d}d ${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}:${pad(s)}`}
      </p>
    </div>
  )
}
