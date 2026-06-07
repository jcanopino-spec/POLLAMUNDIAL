// Avatar determinista por nombre (estilo del diseño)
const AVATARS = ['🐔', '🐓', '🦅', '⚽', '🥅', '🧤', '🦁', '🐆', '🦊', '😎', '🤠', '👽', '💃', '🧢', '🍔', '🎩', '🤓', '👑']

export function avatarFor(name: string): string {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 997
  return AVATARS[h % AVATARS.length]
}
