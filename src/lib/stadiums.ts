// Mapa: nombre del estadio en el feed (BD) → imagen, datos y dato curioso.
// Fotos de Wikimedia Commons (libre uso) en /public/stadiums/.

type Stadium = {
  img: string
  nombre: string
  ciudad: string
  pais: string
  capacidad: number
  ano: number
  dato: string
}

const STADIUMS: Record<string, Stadium> = {
  'Mexico City Stadium': { img: 'mexico_city', nombre: 'Estadio Azteca', ciudad: 'Ciudad de México', pais: '🇲🇽', capacidad: 83264, ano: 1966, dato: 'El único estadio que ha albergado DOS finales de Mundial (1970 y 1986). Aquí Maradona hizo "La Mano de Dios" y el "Gol del Siglo".' },
  'Guadalajara Stadium': { img: 'guadalajara', nombre: 'Estadio Akron', ciudad: 'Guadalajara', pais: '🇲🇽', capacidad: 49850, ano: 2010, dato: 'Casa de las Chivas. Su diseño imita una nube/volcán sobre el verde del valle.' },
  'Monterrey Stadium': { img: 'monterrey', nombre: 'Estadio BBVA', ciudad: 'Monterrey', pais: '🇲🇽', capacidad: 53500, ano: 2015, dato: 'Apodado "El Gigante de Acero", con vista directa al Cerro de la Silla. Casa de Rayados.' },
  'BC Place Vancouver': { img: 'vancouver', nombre: 'BC Place', ciudad: 'Vancouver', pais: '🇨🇦', capacidad: 54500, ano: 1983, dato: 'Tiene el techo retráctil de soporte por cable más grande del mundo.' },
  'Toronto Stadium': { img: 'toronto', nombre: 'BMO Field', ciudad: 'Toronto', pais: '🇨🇦', capacidad: 45000, ano: 2007, dato: 'Casa del Toronto FC; ampliado especialmente para el Mundial.' },
  'New York/New Jersey Stadium': { img: 'new_york', nombre: 'MetLife Stadium', ciudad: 'Nueva York/NJ', pais: '🇺🇸', capacidad: 82500, ano: 2010, dato: '🏆 SEDE DE LA GRAN FINAL. Lo comparten los Giants y los Jets de la NFL.' },
  'Los Angeles Stadium': { img: 'los_angeles', nombre: 'SoFi Stadium', ciudad: 'Los Ángeles', pais: '🇺🇸', capacidad: 70000, ano: 2020, dato: 'El estadio más caro jamás construido (~5.500 millones USD). Techo translúcido y pantalla "Infinity" de doble cara.' },
  'Dallas Stadium': { img: 'dallas', nombre: 'AT&T Stadium', ciudad: 'Dallas', pais: '🇺🇸', capacidad: 80000, ano: 2009, dato: 'Apodado "Jerry World". Su pantalla central colgante fue la más grande del mundo. Sede de semifinal y se expande a 100.000.' },
  'Atlanta Stadium': { img: 'atlanta', nombre: 'Mercedes-Benz Stadium', ciudad: 'Atlanta', pais: '🇺🇸', capacidad: 71000, ano: 2017, dato: 'Su techo se abre como el lente de una cámara fotográfica. Sede de semifinal.' },
  'San Francisco Bay Area Stadium': { img: 'san_francisco', nombre: "Levi's Stadium", ciudad: 'San Francisco', pais: '🇺🇸', capacidad: 68500, ano: 2014, dato: 'De los estadios más "verdes" del mundo: techo con jardín y paneles solares. Casa de los 49ers.' },
  'Seattle Stadium': { img: 'seattle', nombre: 'Lumen Field', ciudad: 'Seattle', pais: '🇺🇸', capacidad: 69000, ano: 2002, dato: 'Uno de los estadios más ruidosos de EE.UU. Casa de los Sounders y los Seahawks.' },
  'Houston Stadium': { img: 'houston', nombre: 'NRG Stadium', ciudad: 'Houston', pais: '🇺🇸', capacidad: 72220, ano: 2002, dato: 'Primer estadio de la NFL con techo retráctil. Aire acondicionado para el calor de Texas.' },
  'Kansas City Stadium': { img: 'kansas_city', nombre: 'Arrowhead Stadium', ciudad: 'Kansas City', pais: '🇺🇸', capacidad: 76416, ano: 1972, dato: '🔊 Récord Guinness del estadio MÁS RUIDOSO del mundo: 142,2 decibeles. Que tiemblen los rivales.' },
  'Boston Stadium': { img: 'boston', nombre: 'Gillette Stadium', ciudad: 'Boston', pais: '🇺🇸', capacidad: 65878, ano: 2002, dato: 'Casa de los Patriots; tiene una réplica de puente y faro a la entrada.' },
  'Miami Stadium': { img: 'miami', nombre: 'Hard Rock Stadium', ciudad: 'Miami', pais: '🇺🇸', capacidad: 65326, ano: 1987, dato: 'Sede del partido por el TERCER PUESTO. Ya albergó Super Bowls y el Mundial de Clubes.' },
  'Philadelphia Stadium': { img: 'philadelphia', nombre: 'Lincoln Financial Field', ciudad: 'Filadelfia', pais: '🇺🇸', capacidad: 69176, ano: 2003, dato: 'Apodado "The Linc". Casa de los Eagles, junto a la cuna de la independencia de EE.UU.' },
}

export function stadiumOf(venue: string | null) {
  return venue ? STADIUMS[venue] ?? null : null
}
