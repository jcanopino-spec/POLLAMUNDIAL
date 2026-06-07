import Link from 'next/link'
import { logout } from '@/app/login/actions'
import type { Session } from '@/lib/session'

export default function Nav({ session, active }: { session: Session; active: 'fixture' | 'posiciones' | 'campeon' | 'admin' | 'reglas' }) {
  const tab = (href: string, key: string, label: string) => (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
        active === key ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
      }`}
    >
      {label}
    </Link>
  )
  return (
    <header className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur border-b border-slate-800">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          <span className="text-xl mr-1" title="Maple, Zayu y Clutch te vigilan">🫎🐆🦅</span>
          {tab('/', 'fixture', 'Pronósticos')}
          {tab('/posiciones', 'posiciones', 'Posiciones')}
          {tab('/campeon', 'campeon', 'Apuestas')}
          {tab('/bienvenida', 'reglas', 'Reglas')}
          {session.isAdmin && tab('/admin', 'admin', 'Admin')}
        </div>
        <form action={logout} className="shrink-0 flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">{session.name}</span>
          <button className="text-xs text-slate-400 hover:text-white border border-slate-700 rounded-full px-2.5 py-1">
            Salir
          </button>
        </form>
      </div>
    </header>
  )
}
