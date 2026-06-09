// Mapa: nombre del estadio en el feed (BD) → imagen, nombre oficial, ciudad y bandera del país sede.
// Fotos de Wikimedia Commons (libre uso) en /public/stadiums/.

type Stadium = { img: string; nombre: string; ciudad: string; pais: string }

const STADIUMS: Record<string, Stadium> = {
  'Mexico City Stadium': { img: 'mexico_city', nombre: 'Estadio Azteca', ciudad: 'Ciudad de México', pais: '🇲🇽' },
  'Guadalajara Stadium': { img: 'guadalajara', nombre: 'Estadio Akron', ciudad: 'Guadalajara', pais: '🇲🇽' },
  'Monterrey Stadium': { img: 'monterrey', nombre: 'Estadio BBVA', ciudad: 'Monterrey', pais: '🇲🇽' },
  'BC Place Vancouver': { img: 'vancouver', nombre: 'BC Place', ciudad: 'Vancouver', pais: '🇨🇦' },
  'Toronto Stadium': { img: 'toronto', nombre: 'BMO Field', ciudad: 'Toronto', pais: '🇨🇦' },
  'New York/New Jersey Stadium': { img: 'new_york', nombre: 'MetLife Stadium', ciudad: 'Nueva York/NJ', pais: '🇺🇸' },
  'Los Angeles Stadium': { img: 'los_angeles', nombre: 'SoFi Stadium', ciudad: 'Los Ángeles', pais: '🇺🇸' },
  'Dallas Stadium': { img: 'dallas', nombre: 'AT&T Stadium', ciudad: 'Dallas', pais: '🇺🇸' },
  'Atlanta Stadium': { img: 'atlanta', nombre: 'Mercedes-Benz Stadium', ciudad: 'Atlanta', pais: '🇺🇸' },
  'San Francisco Bay Area Stadium': { img: 'san_francisco', nombre: "Levi's Stadium", ciudad: 'San Francisco', pais: '🇺🇸' },
  'Seattle Stadium': { img: 'seattle', nombre: 'Lumen Field', ciudad: 'Seattle', pais: '🇺🇸' },
  'Houston Stadium': { img: 'houston', nombre: 'NRG Stadium', ciudad: 'Houston', pais: '🇺🇸' },
  'Kansas City Stadium': { img: 'kansas_city', nombre: 'Arrowhead Stadium', ciudad: 'Kansas City', pais: '🇺🇸' },
  'Boston Stadium': { img: 'boston', nombre: 'Gillette Stadium', ciudad: 'Boston', pais: '🇺🇸' },
  'Miami Stadium': { img: 'miami', nombre: 'Hard Rock Stadium', ciudad: 'Miami', pais: '🇺🇸' },
  'Philadelphia Stadium': { img: 'philadelphia', nombre: 'Lincoln Financial Field', ciudad: 'Filadelfia', pais: '🇺🇸' },
}

export function stadiumOf(venue: string | null) {
  return venue ? STADIUMS[venue] ?? null : null
}
