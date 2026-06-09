// Las tres mascotas oficiales del Mundial 2026 (Canadá · México · EE.UU.)
export const MASCOTAS = [
  { emoji: '🫎', nombre: 'Maple', animal: 'Alce', pais: 'Canadá', flag: '🇨🇦', color: '#E1382F', frase: 'El alce que no perdona un pronóstico tarde.' },
  { emoji: '🐆', nombre: 'Zayu', animal: 'Jaguar', pais: 'México', flag: '🇲🇽', color: '#1B9150', frase: 'El jaguar que ya sabe quién queda de último.' },
  { emoji: '🦅', nombre: 'Clutch', animal: 'Águila', pais: 'EE. UU.', flag: '🇺🇸', color: '#3447D6', frase: 'El águila que lo ve TODO… hasta tus 0 puntos.' },
] as const

// Banda compacta: tres burbujas con la mascota botando (para login / cabeceras)
export function MascotBand({ size = 56 }: { size?: number }) {
  return (
    <div className="flex items-end justify-center gap-3">
      {MASCOTAS.map((m, i) => (
        <div key={m.nombre} className="flex flex-col items-center">
          <div
            className="mascot bob flex items-center justify-center"
            style={{
              width: size,
              height: size,
              fontSize: size * 0.52,
              animationDelay: `${i * 0.25}s`,
              boxShadow: `0 6px 0 ${m.color}`,
            }}
          >
            {m.emoji}
          </div>
          <span className="text-[10px] font-extrabold mt-1.5" style={{ color: 'var(--ink)' }}>
            {m.nombre}
          </span>
          <span className="text-[9px] font-bold" style={{ color: 'var(--muted)' }}>{m.flag}</span>
        </div>
      ))}
    </div>
  )
}

// Tarjetas con descripción (para la página El Parche / reglas)
export function MascotCards() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {MASCOTAS.map((m) => (
        <div key={m.nombre} className="card !p-2.5 flat text-center" style={{ boxShadow: 'none', borderColor: m.color }}>
          <div className="text-3xl">{m.emoji}</div>
          <div className="text-[11px] font-extrabold mt-1">{m.nombre}</div>
          <div className="text-[9px] font-bold" style={{ color: 'var(--muted)' }}>{m.flag} {m.animal}</div>
        </div>
      ))}
    </div>
  )
}
