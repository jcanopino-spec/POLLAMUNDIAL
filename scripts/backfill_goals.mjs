import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard'
const canon = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z ]/g, '').trim()
const alias = { 'south korea': 'korea republic', 'czech republic': 'czechia', 'united states': 'usa', 'ivory coast': 'cote divoire', 'cape verde': 'cabo verde', 'dr congo': 'congo dr' }
const cn = (s) => alias[canon(s)] ?? canon(s)

const { data: matches } = await db.from('matches').select('id, home_team, away_team, kickoff_utc, status').eq('status', 'finished')
const dates = [...new Set(matches.map((m) => m.kickoff_utc.slice(0, 10).replace(/-/g, '')))]
let updated = 0
for (const ymd of dates) {
  const res = await fetch(`${ESPN}?dates=${ymd}`, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) continue
  const data = await res.json()
  for (const ev of data.events ?? []) {
    const c = ev.competitions?.[0]; if (!c) continue
    const H = c.competitors.find((x) => x.homeAway === 'home'); const A = c.competitors.find((x) => x.homeAway === 'away')
    if (!H || !A) continue
    const m = matches.find((x) =>
      (cn(x.home_team) === cn(H.team.displayName) && cn(x.away_team) === cn(A.team.displayName)) ||
      (cn(x.home_team) === cn(A.team.displayName) && cn(x.away_team) === cn(H.team.displayName)))
    if (!m) continue
    const teamById = { [H.team.id]: H.team.displayName, [A.team.id]: A.team.displayName }
    const goals = []
    for (const d of c.details ?? []) {
      if (!d.scoringPlay || d.ownGoal) continue
      const ath = (d.athletesInvolved ?? [])[0]
      const name = ath?.shortName ?? ath?.displayName; if (!name) continue
      // mapear el equipo ESPN al nombre de nuestra BD
      const espnTeam = teamById[d.team?.id] ?? ''
      const team = cn(m.home_team) === cn(espnTeam) ? m.home_team : cn(m.away_team) === cn(espnTeam) ? m.away_team : espnTeam
      goals.push({ name, team, min: d.clock?.displayValue ?? '' })
    }
    if (goals.length) { await db.from('matches').update({ goals }).eq('id', m.id); updated++ }
  }
}
console.log('Partidos con goleadores guardados:', updated)
