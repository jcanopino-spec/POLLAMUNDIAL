import type { Match } from './db'

export type GroupRow = {
  team: string
  pj: number
  g: number
  e: number
  p: number
  gf: number
  gc: number
  dif: number
  pts: number
}

// Calcula la tabla de un grupo a partir de sus partidos (solo finalizados/en vivo con marcador).
export function groupTable(matches: Match[]): GroupRow[] {
  const t = new Map<string, GroupRow>()
  const ensure = (team: string) => {
    if (!t.has(team)) t.set(team, { team, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, dif: 0, pts: 0 })
    return t.get(team)!
  }
  for (const m of matches) {
    ensure(m.home_team)
    ensure(m.away_team)
    if (m.home_score == null || m.away_score == null || m.status === 'scheduled') continue
    const h = ensure(m.home_team)
    const a = ensure(m.away_team)
    h.pj++; a.pj++
    h.gf += m.home_score; h.gc += m.away_score
    a.gf += m.away_score; a.gc += m.home_score
    if (m.home_score > m.away_score) { h.g++; h.pts += 3; a.p++ }
    else if (m.home_score < m.away_score) { a.g++; a.pts += 3; h.p++ }
    else { h.e++; a.e++; h.pts++; a.pts++ }
  }
  const rows = [...t.values()]
  rows.forEach((r) => (r.dif = r.gf - r.gc))
  // Orden FIFA simplificado: PTS, DIF, GF, alfabético
  rows.sort((x, y) => y.pts - x.pts || y.dif - x.dif || y.gf - x.gf || x.team.localeCompare(y.team))
  return rows
}

// Tabla de goleadores. Usa matches.goals (jsonb [{name, team, min}]) que trae el equipo;
// si un partido viejo no lo tiene, cae al texto 'scorers' (sin equipo).
export type Scorer = { name: string; goals: number; team: string | null }

export function topScorers(matches: Match[]): Scorer[] {
  const acc = new Map<string, { goals: number; team: string | null }>()
  const add = (name: string, team: string | null) => {
    const cur = acc.get(name) ?? { goals: 0, team: null }
    cur.goals++
    if (team) cur.team = team
    acc.set(name, cur)
  }
  for (const m of matches) {
    if (Array.isArray(m.goals) && m.goals.length) {
      for (const g of m.goals) if (g?.name) add(g.name, g.team ?? null)
    } else if (m.scorers) {
      for (const raw of m.scorers.split(',')) {
        const t = raw.trim()
        if (!t || /a\.p\./i.test(t)) continue
        const name = t.replace(/^\d+'?(\+\d+)?'?\s*/, '').replace(/\((pen|p)\)/gi, '').trim()
        if (name) add(name, null)
      }
    }
  }
  return [...acc.entries()]
    .map(([name, v]) => ({ name, goals: v.goals, team: v.team }))
    .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name))
}
