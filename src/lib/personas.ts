// El Parche de Alameda: identidad cómica de cada vecino.
// Emoji elegido para encarnar su `icono_prompt_3d` (estilo claymorphism del diseño).
export type Persona = { emoji: string; tag: string; prompt: string }

const P: Record<string, Persona> = {
  'Jaime Cano': { emoji: '🧮', tag: 'Los números', prompt: 'Calculadora con guantes de portero atajando un balón' },
  'Jessica Palacio': { emoji: '🐶', tag: 'Perros', prompt: 'Perrito pug mordiendo un balón de fútbol' },
  'Juan Cano': { emoji: '🥽', tag: 'La tecnología', prompt: 'Gafas de realidad virtual sobre un balón con luces de neón' },
  'Oscar Vergara': { emoji: '🍾', tag: 'El aguardiente', prompt: 'Botella de aguardiente abrazando la copa del mundo' },
  'Paula Hurtado': { emoji: '🚬', tag: 'El cigarrillo', prompt: 'Cigarrillo gordito con banda de capitán fumando de forma cómica' },
  'Juan Hurtado': { emoji: '📺', tag: 'Las pantallas', prompt: 'Monitor de TV transmitiendo un partido mientras suda de los nervios' },
  'Carlos Ruiz': { emoji: '🪗', tag: 'Los vallenatos', prompt: 'Acordeón con sombrero vueltiao tocando encima de una cancha' },
  'Celene Alvarez': { emoji: '🎤', tag: 'Cantar', prompt: 'Micrófono de oro narrando un gol a todo pulmón' },
  'Cristina Alvarez': { emoji: '🛍️', tag: 'Las compras', prompt: 'Bolsa de compras llena de balones y tarjetas amarillas' },
  'Alex Giraldo': { emoji: '🐴', tag: 'Los caballos', prompt: 'Caballo de ajedrez usando guayos de fútbol' },
  'Matias Giraldo': { emoji: '🧤', tag: 'Arquero de fútbol', prompt: 'Guantes de portero gigantes y esponjosos bloqueando un arco' },
  'Andres Salazar': { emoji: '💼', tag: 'Los negocios', prompt: 'Maletín de ejecutivo del que salen billetes y tarjetas rojas' },
  'Sandra Patiño': { emoji: '❓', tag: 'Diseñadora · GUESS', prompt: 'El triángulo rojo de GUESS® cosiendo la camiseta de la selección' },
  'Matias Salazar': { emoji: '⚽', tag: 'Fútbol', prompt: 'Balón clásico con corona de campeón' },
  'Ivan Velez': { emoji: '🛋️', tag: 'Dormir en silla', prompt: 'Silla reclinable roncando con bufanda de hincha puesta' },
  'Adriana Jaramillo': { emoji: '🟥', tag: 'Regañar', prompt: 'Silbato de árbitro furioso sacando tarjeta roja' },
  'Emiliano Chavarriaga': { emoji: '🍼', tag: 'El bebé', prompt: 'Biberón relleno de bebida energizante de futbolista' },
  'Hector Chavarriaga': { emoji: '🌽', tag: 'Maíz', prompt: 'Mazorca de maíz vestida de director técnico' },
  'Julia Perez': { emoji: '💰', tag: 'Vender', prompt: 'Caja registradora cobrando las apuestas de la polla' },
  'Mauricio Foranda': { emoji: '🤳', tag: 'Influencer de redes', prompt: 'Aro de luz grabando un balón que hace dominadas' },
  'Edisón Fernandez': { emoji: '👷', tag: 'Ingeniero', prompt: 'Casco de obra amarillo pintado con pentágonos de balón' },
  'Miguel Gutierrez': { emoji: '👴', tag: 'Pensionado', prompt: 'Bastón de abuelo levantando la copa del mundo' },
  'Ricardo Estupiñan': { emoji: '👔', tag: 'Empleado', prompt: 'Corbata oficinista sudando la gota gorda frente a un arco' },
  'Francisco Duque': { emoji: '👨‍🍳', tag: 'Cocinero', prompt: 'Gorro de chef revolviendo un sancocho con un balón' },
  'Andres Osorno': { emoji: '⏰', tag: 'Empleado', prompt: 'Reloj checador de oficina marcando la hora del partido' },
  'Henrry Muñeton': { emoji: '🏍️', tag: 'Conductor de moto', prompt: 'Casco de motociclista acelerando hacia la portería' },
  'Reynaldo Cano': { emoji: '🎙️', tag: 'Periodista chiviado', prompt: 'Micrófono de prensa antiguo dando noticias falsas del Mundial' },
  'Victor Mendoza': { emoji: '🧱', tag: 'Constructor', prompt: 'Ladrillo sonriente con casco de la selección' },
  'Richard Perez': { emoji: '🛎️', tag: 'Mayordomo', prompt: 'Bandeja de plata sirviendo un balón de fútbol elegante' },
  'simulador 1': { emoji: '🤖', tag: 'Bot de pruebas', prompt: 'Robot pateando penales de mentiras' },
  'simulador 2': { emoji: '🤖', tag: 'Bot de pruebas', prompt: 'Robot pateando penales de mentiras' },
  'simulador 3': { emoji: '🤖', tag: 'Bot de pruebas', prompt: 'Robot pateando penales de mentiras' },
  'simulador 4': { emoji: '🤖', tag: 'Bot de pruebas', prompt: 'Robot pateando penales de mentiras' },
  'simulador 5': { emoji: '🤖', tag: 'Bot de pruebas', prompt: 'Robot pateando penales de mentiras' },
  'Juan Jose': { emoji: '💈', tag: 'El barbero', prompt: 'Poste de barbero girando mientras le hace el corte a un balón de fútbol' },
  jcanopino: { emoji: '😎', tag: 'CEO INPLUX SAS', prompt: 'El jefe administrando la polla desde los estadios del Mundial' },
}

// Apodos del Excel → mismo personaje (las vistas suelen mostrar nickname || name)
const APODOS: Record<string, string> = {
  'el mundialista': 'Jaime Cano', yuyeimi: 'Jessica Palacio', juanma: 'Juan Cano',
  oscarito: 'Oscar Vergara', 'doña flavia': 'Paula Hurtado', juanda: 'Juan Hurtado',
  carlitos: 'Carlos Ruiz', shakira: 'Celene Alvarez', 'doña cristina': 'Cristina Alvarez',
  'don rsu': 'Alex Giraldo', 'matias y chente': 'Matias Giraldo', andresito: 'Andres Salazar',
  'doña guess': 'Sandra Patiño', matias: 'Matias Salazar', ivancho: 'Ivan Velez',
  'doña adriana': 'Adriana Jaramillo', 'el bebe': 'Emiliano Chavarriaga', maíz: 'Hector Chavarriaga',
  'doña julia': 'Julia Perez', 'somos instantes': 'Mauricio Foranda', 'don edson': 'Edisón Fernandez',
  'don soussa': 'Miguel Gutierrez', estupiñan: 'Ricardo Estupiñan', kiko: 'Francisco Duque',
  herbin: 'Andres Osorno', gerundio: 'Henrry Muñeton', 'el periodista': 'Reynaldo Cano',
  'el constructor': 'Victor Mendoza', 'el mayordomo': 'Richard Perez', 'el barbero': 'Juan Jose',
}

export function personaFor(nameOrApodo: string): Persona | null {
  if (P[nameOrApodo]) return P[nameOrApodo]
  const byApodo = APODOS[nameOrApodo.trim().toLowerCase()]
  return byApodo ? P[byApodo] : null
}
