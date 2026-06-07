import { personaFor } from './personas'

// Avatar del vecino: su personaje del Parche; si no tiene, emoji determinista.
const FALLBACK = ['🐔', '🐓', '🦅', '⚽', '🥅', '🧤', '🦁', '🐆', '🦊', '😎', '🤠', '👽', '💃', '🧢', '🍔', '🎩', '🤓', '👑']

export function avatarFor(nameOrApodo: string): string {
  const p = personaFor(nameOrApodo)
  if (p) return p.emoji
  let h = 0
  for (const ch of nameOrApodo) h = (h * 31 + ch.charCodeAt(0)) % 997
  return FALLBACK[h % FALLBACK.length]
}
