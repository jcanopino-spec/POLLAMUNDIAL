import Link from 'next/link'
import type { Session } from '@/lib/session'

const TABS = [
  { key: 'fixture', href: '/', ic: '🎯', label: 'Pronos' },
  { key: 'posiciones', href: '/posiciones', ic: '🏆', label: 'Tabla' },
  { key: 'campeon', href: '/campeon', ic: '👑', label: 'Apuestas' },
  { key: 'reglas', href: '/bienvenida', ic: '🐔', label: 'Reglas' },
] as const

export default function Nav({ session, active }: { session: Session; active: 'fixture' | 'posiciones' | 'campeon' | 'admin' | 'reglas' }) {
  return (
    <nav className="nav">
      {TABS.map((t) => (
        <Link key={t.key} href={t.href} className={active === t.key ? 'on' : ''}>
          <span className="ic">{t.ic}</span>
          {t.label}
        </Link>
      ))}
      {session.isAdmin && (
        <Link href="/admin" className={active === 'admin' ? 'on' : ''}>
          <span className="ic">🛠️</span>
          Admin
        </Link>
      )}
    </nav>
  )
}
