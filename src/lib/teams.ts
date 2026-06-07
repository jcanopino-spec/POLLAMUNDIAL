// Nombres del feed (inglés) → nombre en español + bandera.
// Los placeholders de eliminatorias ('2A', '1C', '3ABCDF', 'W89'...) se muestran traducidos.

const TEAMS: Record<string, { es: string; flag: string }> = {
  Mexico: { es: 'México', flag: '🇲🇽' },
  'South Africa': { es: 'Sudáfrica', flag: '🇿🇦' },
  'Korea Republic': { es: 'Corea del Sur', flag: '🇰🇷' },
  Czechia: { es: 'Chequia', flag: '🇨🇿' },
  Canada: { es: 'Canadá', flag: '🇨🇦' },
  'Bosnia and Herzegovina': { es: 'Bosnia y Herzegovina', flag: '🇧🇦' },
  Qatar: { es: 'Catar', flag: '🇶🇦' },
  Switzerland: { es: 'Suiza', flag: '🇨🇭' },
  Brazil: { es: 'Brasil', flag: '🇧🇷' },
  Morocco: { es: 'Marruecos', flag: '🇲🇦' },
  Haiti: { es: 'Haití', flag: '🇭🇹' },
  Scotland: { es: 'Escocia', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  USA: { es: 'Estados Unidos', flag: '🇺🇸' },
  Paraguay: { es: 'Paraguay', flag: '🇵🇾' },
  Australia: { es: 'Australia', flag: '🇦🇺' },
  Türkiye: { es: 'Turquía', flag: '🇹🇷' },
  Germany: { es: 'Alemania', flag: '🇩🇪' },
  Curaçao: { es: 'Curazao', flag: '🇨🇼' },
  "Côte d'Ivoire": { es: 'Costa de Marfil', flag: '🇨🇮' },
  Ecuador: { es: 'Ecuador', flag: '🇪🇨' },
  Netherlands: { es: 'Países Bajos', flag: '🇳🇱' },
  Japan: { es: 'Japón', flag: '🇯🇵' },
  Sweden: { es: 'Suecia', flag: '🇸🇪' },
  Tunisia: { es: 'Túnez', flag: '🇹🇳' },
  Belgium: { es: 'Bélgica', flag: '🇧🇪' },
  Egypt: { es: 'Egipto', flag: '🇪🇬' },
  'IR Iran': { es: 'Irán', flag: '🇮🇷' },
  'New Zealand': { es: 'Nueva Zelanda', flag: '🇳🇿' },
  Spain: { es: 'España', flag: '🇪🇸' },
  'Cabo Verde': { es: 'Cabo Verde', flag: '🇨🇻' },
  'Saudi Arabia': { es: 'Arabia Saudita', flag: '🇸🇦' },
  Uruguay: { es: 'Uruguay', flag: '🇺🇾' },
  France: { es: 'Francia', flag: '🇫🇷' },
  Senegal: { es: 'Senegal', flag: '🇸🇳' },
  Norway: { es: 'Noruega', flag: '🇳🇴' },
  Iraq: { es: 'Irak', flag: '🇮🇶' },
  Argentina: { es: 'Argentina', flag: '🇦🇷' },
  Algeria: { es: 'Argelia', flag: '🇩🇿' },
  Austria: { es: 'Austria', flag: '🇦🇹' },
  Jordan: { es: 'Jordania', flag: '🇯🇴' },
  Colombia: { es: 'Colombia', flag: '🇨🇴' },
  Portugal: { es: 'Portugal', flag: '🇵🇹' },
  Uzbekistan: { es: 'Uzbekistán', flag: '🇺🇿' },
  'Congo DR': { es: 'RD Congo', flag: '🇨🇩' },
  England: { es: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  Croatia: { es: 'Croacia', flag: '🇭🇷' },
  Ghana: { es: 'Ghana', flag: '🇬🇭' },
  Panama: { es: 'Panamá', flag: '🇵🇦' },
}

export const ALL_TEAMS = Object.keys(TEAMS)

export function teamLabel(name: string): string {
  const t = TEAMS[name]
  if (t) return `${t.flag} ${t.es}`
  return placeholderLabel(name)
}

export function teamEs(name: string): string {
  return TEAMS[name]?.es ?? placeholderLabel(name)
}

// '1A' → '1º Grupo A' · '3ABCDF' → '3º de A/B/C/D/F' · 'W89' → 'Ganador P89' · 'RU101'/'L101' → 'Perdedor P101'
function placeholderLabel(code: string): string {
  let m = code.match(/^([123])([A-L])$/)
  if (m) return `${m[1]}º Grupo ${m[2]}`
  m = code.match(/^3([A-L]{2,})$/)
  if (m) return `3º de ${m[1].split('').join('/')}`
  m = code.match(/^W(\d+)$/)
  if (m) return `Ganador P${m[1]}`
  m = code.match(/^(?:L|RU)(\d+)$/)
  if (m) return `Perdedor P${m[1]}`
  return code
}

export function isPlaceholder(name: string): boolean {
  return !(name in TEAMS)
}

export function teamFlag(name: string): string {
  return TEAMS[name]?.flag ?? '❔'
}

// Nombre corto para las tarjetas (estilo del diseño)
const SHORT: Record<string, string> = {
  'Estados Unidos': 'EE.UU.',
  'Países Bajos': 'Países B.',
  'Bosnia y Herzegovina': 'Bosnia',
  'Corea del Sur': 'Corea S.',
  'Nueva Zelanda': 'N. Zelanda',
  'Costa de Marfil': 'C. Marfil',
  'Arabia Saudita': 'Arabia S.',
}
export function teamShort(name: string): string {
  const es = TEAMS[name]?.es
  if (es) return SHORT[es] ?? es
  return teamEs(name)
}

// Hora de Colombia para mostrar fechas
export function formatKickoff(utc: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Bogota',
  }).format(new Date(utc))
}
