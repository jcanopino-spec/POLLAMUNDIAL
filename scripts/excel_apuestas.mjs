import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import pkg from 'exceljs'
const { Workbook } = pkg

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const ES = { Mexico:'México','South Africa':'Sudáfrica','Korea Republic':'Corea',Czechia:'Chequia',Canada:'Canadá','Bosnia and Herzegovina':'Bosnia',Qatar:'Catar',Switzerland:'Suiza',Brazil:'Brasil',Morocco:'Marruecos',Haiti:'Haití',Scotland:'Escocia',USA:'EE.UU.',Paraguay:'Paraguay',Australia:'Australia','Türkiye':'Turquía',Germany:'Alemania','Curaçao':'Curazao',"Côte d'Ivoire":'C.Marfil',Ecuador:'Ecuador',Netherlands:'P.Bajos',Japan:'Japón',Sweden:'Suecia',Tunisia:'Túnez',Belgium:'Bélgica',Egypt:'Egipto','IR Iran':'Irán','New Zealand':'N.Zelanda',Spain:'España','Cabo Verde':'CaboVerde','Saudi Arabia':'A.Saudita',Uruguay:'Uruguay',France:'Francia',Senegal:'Senegal',Norway:'Noruega',Iraq:'Irak',Argentina:'Argentina',Algeria:'Argelia',Austria:'Austria',Jordan:'Jordania',Colombia:'Colombia',Portugal:'Portugal',Uzbekistan:'Uzbekistán','Congo DR':'RD Congo',England:'Inglaterra',Croatia:'Croacia',Ghana:'Ghana',Panama:'Panamá' }
const FLAG = { Mexico:'🇲🇽','South Africa':'🇿🇦','Korea Republic':'🇰🇷',Czechia:'🇨🇿',Canada:'🇨🇦','Bosnia and Herzegovina':'🇧🇦',Qatar:'🇶🇦',Switzerland:'🇨🇭',Brazil:'🇧🇷',Morocco:'🇲🇦',Haiti:'🇭🇹',Scotland:'🏴',USA:'🇺🇸',Paraguay:'🇵🇾',Australia:'🇦🇺','Türkiye':'🇹🇷',Germany:'🇩🇪','Curaçao':'🇨🇼',"Côte d'Ivoire":'🇨🇮',Ecuador:'🇪🇨',Netherlands:'🇳🇱',Japan:'🇯🇵',Sweden:'🇸🇪',Tunisia:'🇹🇳',Belgium:'🇧🇪',Egypt:'🇪🇬','IR Iran':'🇮🇷','New Zealand':'🇳🇿',Spain:'🇪🇸','Cabo Verde':'🇨🇻','Saudi Arabia':'🇸🇦',Uruguay:'🇺🇾',France:'🇫🇷',Senegal:'🇸🇳',Norway:'🇳🇴',Iraq:'🇮🇶',Argentina:'🇦🇷',Algeria:'🇩🇿',Austria:'🇦🇹',Jordan:'🇯🇴',Colombia:'🇨🇴',Portugal:'🇵🇹',Uzbekistan:'🇺🇿','Congo DR':'🇨🇩',England:'🏴',Croatia:'🇭🇷',Ghana:'🇬🇭',Panama:'🇵🇦' }
const es = (t) => t ? (ES[t] || t) : '—'
const fl = (t) => t ? (FLAG[t] || '') : ''

const [{ data: parts }, { data: matches }, { data: cfg }] = await Promise.all([
  db.from('participants').select('name,nickname,house_number,is_admin,champion_team,finalist1,finalist2'),
  db.from('matches').select('id,home_team,away_team,winner,status,round'),
  db.from('settings').select('value').eq('key','scoring').single(),
])
const s = cfg.value
const CH = s.champion_bonus, FI = s.finalist_bonus

const real = (t) => t && t !== 'To be announced'
const qualified = new Set()
for (const m of matches.filter((m) => m.round === 4)) { if (real(m.home_team)) qualified.add(m.home_team); if (real(m.away_team)) qualified.add(m.away_team) }
const RN = { 4:'16vos', 5:'octavos', 6:'cuartos', 7:'semis', 8:'final' }
const elimKO = new Map()
for (const m of matches.filter((m) => m.round >= 4 && m.status === 'finished' && m.winner)) {
  const loser = m.winner === m.home_team ? m.away_team : m.home_team
  if (real(loser)) elimKO.set(loser, RN[m.round])
}
const alive = (t) => qualified.has(t) && !elimKO.has(t)
const estado = (t) => !t ? '—' : !qualified.has(t) ? '💀 grupos' : elimKO.has(t) ? '💀 ' + elimKO.get(t) : '✅ vivo'

// ===== MITADES DEL BRACKET (según fixture) =====
// Final = ganador de semi 101 (cuartos 97-98) vs ganador de semi 102 (cuartos 99-100).
// Cada mitad produce UN solo finalista → dos equipos de la misma mitad no pueden ser ambos finalistas.
const byId = new Map(matches.map((m) => [m.id, m]))
const teamsOf = (id) => [byId.get(id)?.home_team, byId.get(id)?.away_team].filter(real)
const leftSet = new Set([...teamsOf(97), ...teamsOf(98)])
const rightSet = new Set([...teamsOf(99), ...teamsOf(100)])
const half = (t) => leftSet.has(t) ? 'L' : rightSet.has(t) ? 'R' : null
const leftAlive = [...leftSet].filter(alive)
const rightAlive = [...rightSet].filter(alive)

// Máximo que puede sumar aún, probando TODOS los cruces posibles de la final:
// un finalista de la izquierda (fL) + uno de la derecha (fR), y el campeón es el ganador de la final.
function maxPotential(C, F1, F2) {
  let best = 0
  const Ls = leftAlive.length ? leftAlive : [null]
  const Rs = rightAlive.length ? rightAlive : [null]
  for (const fL of Ls) for (const fR of Rs) {
    const finalists = [fL, fR].filter(Boolean)
    for (const champ of finalists) {
      let e = 0
      if (C && alive(C) && champ === C) e += CH
      if (F1 && finalists.includes(F1)) e += FI
      if (F2 && finalists.includes(F2)) e += FI
      if (e > best) best = e
    }
  }
  return best
}

const players = parts.filter((p) => !p.is_admin && p.name.toLowerCase() !== 'invitado').map((p) => {
  const potential = maxPotential(p.champion_team, p.finalist1, p.finalist2)
  const champAlive = alive(p.champion_team)
  const f1Alive = alive(p.finalist1), f2Alive = alive(p.finalist2)
  const sameHalf = f1Alive && f2Alive && p.finalist1 !== p.finalist2 && half(p.finalist1) && half(p.finalist1) === half(p.finalist2)
  return { n: p.nickname || p.name, casa: p.house_number, p, potential, champAlive, f1Alive, f2Alive, sameHalf }
}).sort((a, b) => b.potential - a.potential || a.n.localeCompare(b.n))

const maxP = Math.max(...players.map((x) => x.potential))
const minP = Math.min(...players.map((x) => x.potential))
const club60 = players.filter((x) => x.potential === 60).map((x) => x.n)

const C = { ink:'FF1B1714', gold:'FFFFC22E', green:'FF1B9150', greenL:'FFD7F0DC', red:'FFC12A22', redL:'FFFCE0DC', head:'FF14120F', cream:'FFFBF4E6', blue:'FF2E5AA8' }
const border = { top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} }
const wb = new Workbook()
const ws = wb.addWorksheet('Apuestas mayores', { views: [{ state:'frozen', ySplit:5 }] })

// Título + resumen
ws.mergeCells('A1:H1')
ws.getCell('A1').value = '💰 APUESTAS MAYORES — Campeón (+' + CH + ') y Finalistas (+' + FI + ' c/u)'
ws.getCell('A1').font = { bold:true, size:16, color:{argb:'FFFFFFFF'} }
ws.getCell('A1').fill = { type:'pattern', pattern:'solid', fgColor:{argb:C.head} }
ws.getCell('A1').alignment = { horizontal:'center', vertical:'middle' }
ws.getRow(1).height = 26
ws.mergeCells('A2:H2')
ws.getCell('A2').value = `Máx 60 (👑30 + ⭐15 + ⭐15) SEGÚN EL FIXTURE. La final es 1 de la IZQUIERDA [${leftAlive.map(es).join('/')}] vs 1 de la DERECHA [${rightAlive.map(es).join('/')}]: dos finalistas del mismo lado NO pueden llegar juntos.`
ws.getCell('A2').font = { bold:true, size:10 }
ws.getCell('A2').alignment = { horizontal:'center', wrapText:true }
ws.getRow(2).height = 30
ws.mergeCells('A3:H3')
ws.getCell('A3').value = `🔥 PUEDEN LLEGAR A 60: ${club60.length ? club60.join(', ') : 'nadie'}   ·   ⬆️ EL QUE MÁS: ${players[0].n} (${maxP})   ·   ⬇️ EL QUE MENOS: ${players.at(-1).n} (${minP})`
ws.getCell('A3').font = { bold:true, size:11, color:{argb:C.red} }
ws.getCell('A3').fill = { type:'pattern', pattern:'solid', fgColor:{argb:C.gold} }
ws.getCell('A3').alignment = { horizontal:'center', wrapText:true }
ws.getRow(3).height = 28

// Encabezados
const heads = ['#','Parcero','Casa','👑 Campeón','⭐ Finalista 1','⭐ Finalista 2','💰 PUEDE SUMAR','Nota']
const widths = [5, 20, 7, 22, 22, 22, 15, 30]
ws.getRow(5).values = heads
heads.forEach((h, i) => {
  const c = ws.getCell(5, i + 1)
  c.font = { bold:true, color:{argb:'FFFFFFFF'} }; c.fill = { type:'pattern', pattern:'solid', fgColor:{argb:C.head} }
  c.alignment = { horizontal:'center', vertical:'middle', wrapText:true }; c.border = border
  ws.getColumn(i + 1).width = widths[i]
})
ws.getRow(5).height = 22

const cellTeam = (r, col, team, aliveBonus) => {
  const c = ws.getCell(r, col)
  c.value = team ? `${fl(team)} ${es(team)} ${estado(team)}` : '—'
  c.border = border; c.alignment = { horizontal:'left' }
  c.fill = { type:'pattern', pattern:'solid', fgColor:{argb: !team ? C.cream : aliveBonus ? C.greenL : C.redL } }
  if (team && !aliveBonus) c.font = { color:{argb:C.red} }
  else if (team && aliveBonus) c.font = { bold:true, color:{argb:C.green} }
}

players.forEach((x, i) => {
  const r = 6 + i
  ws.getCell(r,1).value = i + 1; ws.getCell(r,1).alignment = { horizontal:'center' }; ws.getCell(r,1).border = border
  const nc = ws.getCell(r,2); nc.value = x.n; nc.font = { bold:true }; nc.border = border; nc.fill = { type:'pattern', pattern:'solid', fgColor:{argb:C.cream} }
  ws.getCell(r,3).value = x.casa; ws.getCell(r,3).alignment = { horizontal:'center' }; ws.getCell(r,3).border = border
  cellTeam(r, 4, x.p.champion_team, x.champAlive)
  cellTeam(r, 5, x.p.finalist1, x.f1Alive)
  cellTeam(r, 6, x.p.finalist2, x.f2Alive)
  const pc = ws.getCell(r,7); pc.value = x.potential; pc.font = { bold:true, size:14, color:{argb:C.ink} }
  pc.alignment = { horizontal:'center' }; pc.border = border
  pc.fill = { type:'pattern', pattern:'solid', fgColor:{argb: x.potential === 60 ? C.gold : x.potential === 0 ? C.redL : C.greenL } }
  const bits = []
  if (x.champAlive) bits.push('👑 +' + CH)
  if (x.sameHalf) bits.push('⚠️ 2 finalistas del MISMO lado: solo 1 llega (+' + FI + ')')
  else { if (x.f1Alive) bits.push('⭐ +' + FI); if (x.f2Alive && x.p.finalist2 !== x.p.finalist1) bits.push('⭐ +' + FI) }
  const note = x.potential === 60 ? '🔥 ¡puede sumar los 60!' : x.potential === 0 ? '💀 sin nada — cero bonos' : bits.join(' · ') || '—'
  const noc = ws.getCell(r,8); noc.value = note; noc.border = border; noc.alignment = { horizontal:'left', wrapText:true }
  noc.font = { bold: x.potential === 60 || x.potential === 0 }
  if (x.potential === 0) noc.font = { color:{argb:C.red}, bold:true }
})

await wb.xlsx.writeFile('/tmp/apuestas-polla.xlsx')
console.log('OK · jugadores:', players.length, '· pueden 60:', club60.length, '· max:', maxP, '· min:', minP)
console.log('Club 60:', club60.join(', ') || '(nadie)')
