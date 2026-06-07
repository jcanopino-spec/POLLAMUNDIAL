import { redirect } from 'next/navigation'
import Nav from '@/components/Nav'
import { adminDb } from '@/lib/db'
import { getSession } from '@/lib/session'
import { personaFor } from '@/lib/personas'
import { avatarFor } from '@/lib/avatar'

export const dynamic = 'force-dynamic'

export default async function ParchePage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const db = adminDb()
  const { data: participants } = await db
    .from('participants')
    .select('id, name, nickname, house_number, is_admin')
    .order('nickname')

  const vecinos = (participants ?? []).filter((p) => !p.is_admin)

  return (
    <div className="shell">
      <div className="shell-content fade">
        <div className="appbar">
          <div>
            <div className="kicker">🫂 Los protagonistas</div>
            <h2 className="display">El Parche</h2>
          </div>
          <span className="pill" style={{ background: 'var(--yellow)' }}>{vecinos.length} 👥</span>
        </div>
        <p className="px-[18px] pb-4 text-xs font-bold -mt-1" style={{ color: 'var(--muted)' }}>
          Cada vecino con su personaje oficial de la polla. Cualquier parecido con la realidad… es totalmente intencional 😂
        </p>

        <div className="grid grid-cols-2 gap-3 px-[18px]">
          {vecinos.map((v) => {
            const display = v.nickname || v.name
            const persona = personaFor(display) ?? personaFor(v.name)
            return (
              <div key={v.id} className="card !p-3 text-center flex flex-col items-center">
                <div
                  className="flex items-center justify-center rounded-full mb-2"
                  style={{
                    width: 64,
                    height: 64,
                    fontSize: 34,
                    background: 'radial-gradient(circle at 50% 34%, #FFE08A, #F6B53C)',
                    border: '3px solid var(--ink)',
                    boxShadow: 'inset 0 -4px 0 rgba(0,0,0,.08)',
                  }}
                >
                  {avatarFor(display)}
                </div>
                <p className="display text-[15px] uppercase leading-none">{display}</p>
                <p className="text-[10px] font-bold mt-0.5" style={{ color: 'var(--muted)' }}>
                  {v.name} · 🏠 {v.house_number ?? '—'}
                </p>
                {persona && (
                  <>
                    <span className="tag-mini mt-1.5" style={{ background: 'var(--yellow)' }}>{persona.tag}</span>
                    <p className="text-[10px] font-bold italic mt-1.5 leading-tight" style={{ color: 'var(--muted)' }}>
                      “{persona.prompt}”
                    </p>
                  </>
                )}
              </div>
            )
          })}
        </div>

        <div className="castigo">
          <div className="big">🐔</div>
          <div className="t">
            ¿No te gusta tu personaje? Reclamos al <b>CEO de INPLUX SAS</b>… que está en el estadio y
            no contesta 😎🏟️
          </div>
        </div>
        <div className="spacer" />
      </div>
      <Nav session={session} active="posiciones" />
    </div>
  )
}
