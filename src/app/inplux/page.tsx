import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

const PRODUCTOS = [
  { emoji: '🧾', nombre: 'Tribai', url: 'https://tribai.co/', desc: 'Inteligencia tributaria y financiera. Hace declaraciones de renta sin sudar (ni mentar madres).' },
  { emoji: '⚖️', nombre: 'Kelsen', url: 'https://kelsen.io/', desc: 'El cerebro legal para empresas y firmas. Sí, la misma gallina que tiene abogados 🐔.' },
  { emoji: '📜', nombre: 'Laudos', url: 'https://laudos.co/', desc: 'Arbitraje y jurisprudencia con IA. Falla más rápido que el VAR.' },
  { emoji: '🐷', nombre: 'Porkia', url: 'https://porkia.co/', desc: 'Software ganadero porcícola. Sí, hasta el cerdo del castigo es de la casa 😏.' },
  { emoji: '🏛️', nombre: 'Gobia', url: 'https://gobia.co/', desc: 'Gemelo digital municipal. Vigila la hacienda pública mejor que Doña Adriana 🟥.' },
]

export default async function InpluxPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="shell">
      <div className="shell-content fade">
        {/* Cabecera */}
        <div className="text-center px-6 pt-6">
          <div className="mascot bob" style={{ width: 92, height: 92, fontSize: 50, background: 'radial-gradient(circle at 50% 34%, #FFE08A, #F6B53C)' }}>
            😎<span className="ball">🚀</span>
          </div>
          <h1 className="display text-3xl uppercase leading-none mt-1">INPLUX SAS</h1>
          <p className="text-[13px] font-bold mt-2" style={{ color: 'var(--muted)' }}>
            El hub de inteligencia artificial de Colombia 🇨🇴
          </p>
          <div className="we" style={{ marginTop: 10 }}>DEL SPEC AL DEPLOY EN SEMANAS, NO MESES</div>
        </div>

        {/* Reseña graciosa */}
        <div className="card mx-[18px] mt-5">
          <p className="text-[13px] font-bold leading-snug">
            ¿Esta polla te pareció bacana? 😏 Pues es apenas un <b>ratico de fin de semana</b> de lo que hacemos.
            <br /><br />
            En <b>INPLUX SAS</b> construimos el <b>“cerebro de IA de Colombia”</b>: agentes inteligentes con memoria
            que aprenden de 25 años de experiencia real y resuelven cosas serias —impuestos, leyes, hacienda pública,
            hasta cerdos 🐷— a una velocidad que asusta. Esta app de la natillera la armamos casi <b>de chiste</b>…
            imagínate lo que hacemos cuando nos pagan 😅.
          </p>
        </div>

        {/* La donación */}
        <div className="castigo" style={{ background: 'var(--green)' }}>
          <div className="big">🎁</div>
          <div className="t">
            <b>La Polla de Alameda</b> es un regalo de <b>INPLUX SAS</b> para la natillera. Sin cobrar un peso.
            Puro cariño de barrio (y de paso, la mejor publicidad 😎).
          </div>
        </div>

        {/* Portafolio */}
        <p className="subhead">Lo que hacemos en serio 👇</p>
        <div className="px-[18px] space-y-2.5">
          {PRODUCTOS.map((p) => (
            <a
              key={p.nombre}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card !p-3 flex items-center gap-3"
              style={{ textDecoration: 'none', color: 'var(--ink)' }}
            >
              <div className="av" style={{ width: 44, height: 44, fontSize: 24 }}>{p.emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="display text-base uppercase leading-none">
                  {p.nombre} <span className="text-[11px] normal-case" style={{ color: 'var(--blue)' }}>↗</span>
                </p>
                <p className="text-[11px] font-bold mt-0.5" style={{ color: 'var(--muted)' }}>{p.desc}</p>
              </div>
            </a>
          ))}
        </div>

        {/* Capacidades */}
        <p className="subhead">¿Qué sabemos hacer? Casi todo 🤖</p>
        <div className="px-[18px] grid grid-cols-2 gap-2">
          {[
            ['🤖', 'Agentes de IA con memoria'],
            ['🏭', 'Fábrica de software'],
            ['🔍', 'RAG verificable (cita fuentes)'],
            ['⚡', 'Automatización a la lata'],
            ['🧠', 'IA tributaria y legal'],
            ['📱', 'Apps web y móviles'],
          ].map(([e, t]) => (
            <div key={t} className="card !p-2.5 flat text-center" style={{ boxShadow: 'none' }}>
              <div className="text-2xl">{e}</div>
              <p className="text-[10.5px] font-extrabold mt-0.5 leading-tight">{t}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-[18px] pt-5">
          <a href="https://inplux.co/" target="_blank" rel="noopener noreferrer" className="btn red block text-center" style={{ textDecoration: 'none' }}>
            🚀 CONÓCENOS EN INPLUX.CO
          </a>
          <p className="text-center text-[11px] font-bold mt-3" style={{ color: 'var(--muted)' }}>
            ¿Tienes una idea o un problema que parece imposible? Nosotros hacemos el milagro… y de paso te lo
            contamos con humor 😎
          </p>
        </div>

        <div className="castigo">
          <div className="big">🐔</div>
          <div className="t">
            <b>INPLUX SAS</b> · Jcanopino, CEO · Hecho con cariño desde los estadios del Mundial 🏟️.
            Prohibido copiar la gallina: tiene abogados (los de Kelsen ⚖️).
          </div>
        </div>
        <div className="section-pad">
          <a href="/" className="btn ghost block text-center" style={{ textDecoration: 'none' }}>← VOLVER A LA POLLA ⚽</a>
        </div>
        <div className="spacer" />
      </div>
    </div>
  )
}
