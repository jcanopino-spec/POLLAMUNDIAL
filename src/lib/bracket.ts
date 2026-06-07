// Bracket oficial FIFA 2026 (104 partidos). Fuente: fixture oficial + Wikipedia knockout stage.
// 16avos: composición por posiciones de grupo; de octavos en adelante, por ganadores.

export const R32: Record<number, [string, string]> = {
  73: ['2A', '2B'], 74: ['1E', '3ABCDF'], 75: ['1F', '2C'], 76: ['1C', '2F'],
  77: ['1I', '3CDFGH'], 78: ['2E', '2I'], 79: ['1A', '3CEFHI'], 80: ['1L', '3EHIJK'],
  81: ['1D', '3BEFIJ'], 82: ['1G', '3AEHIJ'], 83: ['2K', '2L'], 84: ['1H', '2J'],
  85: ['1B', '3EFGIJ'], 86: ['1J', '2H'], 87: ['1K', '3DEIJL'], 88: ['2D', '2G'],
}

// matchId → [partido del local, partido del visitante] (ganadores)
export const KO: Record<number, [number, number]> = {
  89: [74, 77], 90: [73, 75], 91: [76, 78], 92: [79, 80],
  93: [83, 84], 94: [81, 82], 95: [86, 88], 96: [85, 87],
  97: [89, 90], 98: [93, 94], 99: [91, 92], 100: [95, 96],
  101: [97, 98], 102: [99, 100],
  104: [101, 102],
}

export const ROUND_OF: Record<number, string> = Object.fromEntries([
  ...Object.keys(R32).map((m) => [m, 'dieciseisavos']),
  ...[89, 90, 91, 92, 93, 94, 95, 96].map((m) => [m, 'octavos']),
  ...[97, 98, 99, 100].map((m) => [m, 'cuartos']),
  ...[101, 102].map((m) => [m, 'semifinales']),
  [103, 'el partido del orgullo'],
  [104, 'LA FINAL'],
])

export type SimData = {
  order: Record<string, string[]>   // grupo → [1º, 2º, 3º]
  thirds: string[]                  // letras de grupos cuyo 3º clasifica (8)
  slots: Record<string, string>     // "matchId:side" → letra de grupo asignada al cupo de 3º
  winners: Record<string, string>   // matchId → equipo ganador
}

export const EMPTY_SIM: SimData = { order: {}, thirds: [], slots: {}, winners: {} }

// Slots de terceros del bracket: clave "matchId:side" → letras permitidas
export const THIRD_SLOTS: Record<string, string[]> = {}
for (const [m, pair] of Object.entries(R32)) {
  pair.forEach((code, side) => {
    if (code.startsWith('3')) THIRD_SLOTS[`${m}:${side}`] = code.slice(1).split('')
  })
}

// Resuelve todo el bracket a partir de la simulación. Ganadores huérfanos se descartan.
export type Resolved = {
  teams: Record<number, [string | null, string | null]>
  winners: Record<number, string | null>
  losers: Record<number, string | null>
}

export function resolveBracket(data: SimData): Resolved {
  const teams: Resolved['teams'] = {}
  const winners: Resolved['winners'] = {}
  const losers: Resolved['losers'] = {}

  const codeTeam = (code: string, key: string): string | null => {
    if (/^[12][A-L]$/.test(code)) {
      return data.order[code[1]]?.[Number(code[0]) - 1] ?? null
    }
    const letter = data.slots[key]
    if (!letter || !data.thirds.includes(letter)) return null
    return data.order[letter]?.[2] ?? null
  }

  const settle = (m: number, pair: [string | null, string | null]) => {
    teams[m] = pair
    const w = data.winners[String(m)]
    if (w && (pair[0] === w || pair[1] === w)) {
      winners[m] = w
      losers[m] = pair[0] === w ? pair[1] : pair[0]
    } else {
      winners[m] = null
      losers[m] = null
    }
  }

  for (const [mStr, pair] of Object.entries(R32)) {
    const m = Number(mStr)
    settle(m, [codeTeam(pair[0], `${m}:0`), codeTeam(pair[1], `${m}:1`)])
  }
  for (const m of [89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 104]) {
    const [a, b] = KO[m]
    settle(m, [winners[a], winners[b]])
  }
  settle(103, [losers[101], losers[102]])
  return { teams, winners, losers }
}

// ¿Dónde se cruzan dos equipos en esta simulación? (primer partido que los junta)
export function collisionMatch(res: Resolved, a: string, b: string): number | null {
  const ids = [...Object.keys(R32).map(Number), 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 104]
  for (const m of ids.sort((x, y) => x - y)) {
    const t = res.teams[m]
    if (t && t.includes(a) && t.includes(b)) return m
  }
  return null
}

// Asignación automática de terceros a sus slots (backtracking)
export function autoAssignThirds(thirds: string[]): Record<string, string> | null {
  const keys = Object.keys(THIRD_SLOTS)
  const assign: Record<string, string> = {}
  const used = new Set<string>()
  function bt(i: number): boolean {
    if (i === keys.length) return true
    const key = keys[i]
    for (const letter of THIRD_SLOTS[key]) {
      if (!thirds.includes(letter) || used.has(letter)) continue
      assign[key] = letter
      used.add(letter)
      if (bt(i + 1)) return true
      delete assign[key]
      used.delete(letter)
    }
    return false
  }
  return bt(0) ? assign : null
}
