// Seed de los 104 partidos desde data/fixture-raw.json (fixturedownload.com).
// Uso: node scripts/seed.mjs   (requiere .env.local con SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY)
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const fixture = JSON.parse(readFileSync(new URL('../data/fixture-raw.json', import.meta.url), 'utf8'))

const rows = fixture.map((m) => ({
  id: m.MatchNumber,
  round: m.RoundNumber,
  group_name: m.Group ? m.Group.replace('Group ', '') : null,
  kickoff_utc: m.DateUtc.replace(' ', 'T'),
  venue: m.Location,
  home_team: m.HomeTeam,
  away_team: m.AwayTeam,
  home_score: m.HomeTeamScore,
  away_score: m.AwayTeamScore,
  status: m.HomeTeamScore != null && m.AwayTeamScore != null ? 'finished' : 'scheduled',
}))

const { error } = await supabase.from('matches').upsert(rows)
if (error) throw error
console.log(`Seed OK: ${rows.length} partidos`)
