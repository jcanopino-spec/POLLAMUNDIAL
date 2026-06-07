// Utilidades de calendario en hora de Colombia (America/Bogota), siguiendo el calendario oficial FIFA.
import type { Match } from './db'

const TZ = 'America/Bogota'

// 'YYYY-MM-DD' del kickoff en hora colombiana
export function dayKey(utc: string | Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(utc))
}

export function dayChipLabel(key: string): string {
  const d = new Date(`${key}T12:00:00-05:00`)
  return new Intl.DateTimeFormat('es-CO', { weekday: 'short', day: 'numeric', timeZone: TZ }).format(d)
}

export function dayMonthLabel(key: string): string {
  const d = new Date(`${key}T12:00:00-05:00`)
  return new Intl.DateTimeFormat('es-CO', { month: 'short', timeZone: TZ }).format(d)
}

export function dayLongLabel(key: string): string {
  const d = new Date(`${key}T12:00:00-05:00`)
  return new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ }).format(d)
}

// Semana del torneo (1..6) contada desde el día inaugural
export function weekOf(key: string, firstDay: string): number {
  const ms = new Date(`${key}T12:00:00Z`).getTime() - new Date(`${firstDay}T12:00:00Z`).getTime()
  return Math.floor(ms / (7 * 24 * 3600 * 1000)) + 1
}

export type DayGroup = { key: string; matches: Match[] }

export function groupByDay(matches: Match[]): DayGroup[] {
  const map = new Map<string, Match[]>()
  for (const m of matches) {
    const k = dayKey(m.kickoff_utc)
    map.set(k, [...(map.get(k) ?? []), m])
  }
  return [...map.entries()].map(([key, ms]) => ({ key, matches: ms }))
}

// Transmisión en Colombia (derechos confirmados abril 2026)
export function tvColombia(match: Match): string {
  const esColombia = match.home_team === 'Colombia' || match.away_team === 'Colombia'
  return esColombia ? 'Caracol · RCN · DSports · Paramount+ · Disney+' : 'DSports (DGO) · Paramount+'
}

export const FIFA_URL =
  'https://www.fifa.com/es/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures?country=CO&wtw-filter=ALL'
