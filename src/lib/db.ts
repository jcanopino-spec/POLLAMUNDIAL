import { createClient } from '@supabase/supabase-js'

// Cliente con service role: SOLO usar server-side (server actions / route handlers).
export function adminDb() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })
}

export type Match = {
  id: number
  round: number
  group_name: string | null
  kickoff_utc: string
  venue: string | null
  home_team: string
  away_team: string
  home_score: number | null
  away_score: number | null
  winner: string | null
  minute: string | null
  scorers: string | null
  status: 'scheduled' | 'live' | 'finished'
}

export type Prediction = {
  participant_id: string
  match_id: number
  home_score: number
  away_score: number
  points: number | null
}

export type Participant = {
  id: string
  name: string
  is_admin: boolean
  must_change_pin: boolean
  house_number: string | null
  nickname: string | null
  champion_team: string | null
  finalist1: string | null
  finalist2: string | null
}
