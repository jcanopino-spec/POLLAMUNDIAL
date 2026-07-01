// ============================================================================
//  AUDITORÍA DE PUNTAJES — Polla de Alameda
//  Verifica que no existan errores en marcadores ni puntos.
//
//  Uso:   node scripts/auditoria.mjs
//
//  Revisa (replicando EXACTO la lógica de src/lib/scoring.ts):
//   [1] Partidos finalizados sin marcador
//   [2] Partidos con marcador pero en estado 'scheduled'
//   [3] Puntos mal calculados o en NULL en partidos finalizados
//       (incluye el bono +2 de eliminación por acertar goles del ganador)
//   [4] Pronósticos con puntos en partidos AÚN no finalizados
//   [5] Pronósticos duplicados (mismo jugador + partido) que inflarían la tabla
//   [6] Coherencia de la Tabla del Cerdo (30 jugadores, sin admin ni invitado)
//   [7] Bono de eliminación aplicado por partido (para inspección visual)
//
//  Sale con código 1 si encuentra algún problema (útil para CI/cron).
// ============================================================================
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const FINAL_ID = 104
const sign = (n) => (n > 0 ? 1 : n < 0 ? -1 : 0)
const isKO = (r) => r >= 4

async function main() {
  const [{ data: matches }, { data: parts }, { data: cfg }, { data: lastSync }] = await Promise.all([
    db.from('matches').select('*').order('id'),
    db.from('participants').select('id,name,nickname,is_admin,champion_team,finalist1,finalist2'),
    db.from('settings').select('value').eq('key', 'scoring').single(),
    db.from('settings').select('value').eq('key', 'last_sync').maybeSingle(),
  ])
  const s = cfg.value
  const nm = new Map(parts.map((p) => [p.id, p.nickname || p.name]))
  const byId = new Map(matches.map((m) => [m.id, m]))

  // Trae TODOS los pronósticos paginando (Supabase corta en 1000 filas).
  const preds = []
  for (let f = 0; ; f += 1000) {
    const { data } = await db.from('predictions').select('participant_id,match_id,home_score,away_score,points').range(f, f + 999)
    if (!data?.length) break
    preds.push(...data)
    if (data.length < 1000) break
  }

  const mult = (id, r) => (id === FINAL_ID ? s.final_multiplier : (s.multipliers[String(r)] ?? 1))
  function pointsFor(p, m) {
    if (p.home_score === m.home_score && p.away_score === m.away_score) return s.exact * mult(m.id, m.round)
    if (sign(p.home_score - p.away_score) === sign(m.home_score - m.away_score)) {
      let pts = s.outcome * mult(m.id, m.round)
      const bonus = s.winner_goals_bonus ?? 0
      if (isKO(m.round) && bonus && m.home_score !== m.away_score) {
        const wg = Math.max(m.home_score, m.away_score)
        const pwg = m.home_score > m.away_score ? p.home_score : p.away_score
        if (pwg === wg) pts += bonus
      }
      return pts
    }
    return 0
  }

  const problems = []
  const log = (t) => console.log(t)
  log('════════════════════════════════════════════════════════')
  log('  AUDITORÍA DE PUNTAJES · Polla de Alameda')
  log('════════════════════════════════════════════════════════')
  log(`Pronósticos: ${preds.length} · Partidos: ${matches.length} · Config: ${JSON.stringify(s)}`)
  log(`Último sync: ${lastSync?.value?.at ?? '—'}`)

  // [1] finished sin marcador
  const badFin = matches.filter((m) => m.status === 'finished' && (m.home_score == null || m.away_score == null))
  if (badFin.length) problems.push(`[1] ${badFin.length} finalizados sin marcador: ${badFin.map((m) => m.id).join(',')}`)
  log(`\n[1] Finalizados sin marcador ......... ${badFin.length === 0 ? 'OK ✓' : '✗ ' + badFin.length}`)

  // [2] marcador pero scheduled
  const weird = matches.filter((m) => m.home_score != null && m.status === 'scheduled')
  if (weird.length) problems.push(`[2] ${weird.length} con marcador pero 'scheduled': ${weird.map((m) => m.id).join(',')}`)
  log(`[2] Con marcador pero 'scheduled' .... ${weird.length === 0 ? 'OK ✓' : '✗ ' + weird.length}`)

  // [3] y [4] puntos
  let mis = 0, nulls = 0
  for (const p of preds) {
    const m = byId.get(p.match_id)
    if (!m) continue
    if (m.status === 'finished') {
      if (p.points == null) { nulls++; if (nulls <= 10) log(`    NULL: m${p.match_id} ${nm.get(p.participant_id)}`) }
      const should = pointsFor(p, m)
      if ((p.points ?? 0) !== should) {
        mis++
        if (mis <= 25) log(`    ✗ m${p.match_id} (${m.home_team} ${m.home_score}-${m.away_score} ${m.away_team} R${m.round}) ${nm.get(p.participant_id)}: pron ${p.home_score}-${p.away_score} tiene ${p.points}, debe ${should}`)
      }
    } else if (p.points != null) {
      mis++
      if (mis <= 25) log(`    ✗ puntos en NO finalizado m${p.match_id} ${nm.get(p.participant_id)}: ${p.points}`)
    }
  }
  if (mis) problems.push(`[3] ${mis} puntos descuadrados`)
  if (nulls) problems.push(`[4] ${nulls} pronósticos finalizados con puntos NULL`)
  log(`[3] Puntos bien calculados ........... ${mis === 0 ? 'OK ✓' : '✗ ' + mis + ' descuadrados'}`)
  log(`[4] Sin puntos NULL en finalizados ... ${nulls === 0 ? 'OK ✓' : '✗ ' + nulls}`)

  // [5] duplicados
  const seen = new Set(), dups = []
  for (const p of preds) { const k = p.participant_id + '_' + p.match_id; if (seen.has(k)) dups.push(k); else seen.add(k) }
  if (dups.length) problems.push(`[5] ${dups.length} pronósticos duplicados`)
  log(`[5] Sin pronósticos duplicados ....... ${dups.length === 0 ? 'OK ✓' : '✗ ' + dups.length}`)

  // [6] tabla coherente (excluye admin e invitado)
  const players = parts.filter((p) => !p.is_admin && p.name.toLowerCase() !== 'invitado')
  const pids = new Set(players.map((p) => p.id))
  const tot = new Map()
  for (const p of preds) { if (!pids.has(p.participant_id)) continue; tot.set(p.participant_id, (tot.get(p.participant_id) || 0) + (p.points || 0)) }
  const rank = [...tot.entries()].map(([id, t]) => ({ n: nm.get(id), t })).sort((a, b) => b.t - a.t)
  log(`[6] Tabla del Cerdo .................. ${rank.length} jugadores`)
  if (rank.length) {
    rank.slice(0, 3).forEach((r, i) => log(`      ${i + 1}. ${r.n} — ${r.t}`))
    log(`      🐷 colero: ${rank.at(-1).n} — ${rank.at(-1).t}`)
  }

  // [7] bono de eliminación por partido (inspección)
  const koFin = matches.filter((m) => m.round >= 4 && m.status === 'finished')
  if (koFin.length) {
    log(`\n[7] Eliminación jugada (${koFin.length} partidos) · exactos / con bono +2:`)
    for (const m of koFin) {
      const ps = preds.filter((p) => p.match_id === m.id)
      const ex = ps.filter((p) => p.home_score === m.home_score && p.away_score === m.away_score).length
      const bono = ps.filter((p) => {
        const isEx = p.home_score === m.home_score && p.away_score === m.away_score
        const isRe = sign(p.home_score - p.away_score) === sign(m.home_score - m.away_score)
        if (isEx || !isRe || m.home_score === m.away_score) return false
        const wg = Math.max(m.home_score, m.away_score)
        const pwg = m.home_score > m.away_score ? p.home_score : p.away_score
        return pwg === wg
      }).length
      log(`      m${m.id} ${m.home_team} ${m.home_score}-${m.away_score} ${m.away_team} (x${mult(m.id, m.round)}) → 🎯${ex} · 🥈${bono}`)
    }
  }

  // Persistir resultado para el banner de Admin (mismo formato que el endpoint)
  const result = {
    ok: problems.length === 0,
    ranAt: new Date().toISOString(),
    problems,
    stats: { preds: preds.length, finishedNoScore: badFin.length, scoredButScheduled: weird.length, miscalculated: mis, nullPoints: nulls, duplicates: dups.length, tablePlayers: rank.length },
  }
  await db.from('settings').upsert({ key: 'last_audit', value: result })

  log('\n════════════════════════════════════════════════════════')
  if (problems.length === 0) {
    log('  ✅ TODO SANO — no hay errores en los puntajes.')
    log('════════════════════════════════════════════════════════')
    process.exit(0)
  } else {
    log('  ⛔ PROBLEMAS ENCONTRADOS:')
    problems.forEach((p) => log('   · ' + p))
    log('════════════════════════════════════════════════════════')
    process.exit(1)
  }
}

main().catch((e) => { console.error('Error en la auditoría:', e); process.exit(1) })
