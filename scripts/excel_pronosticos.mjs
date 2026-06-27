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
const es = (t) => ES[t] || t
const FASE = { 1:'F1', 2:'F2', 3:'F3' }
const FLAG = { Mexico:'🇲🇽','South Africa':'🇿🇦','Korea Republic':'🇰🇷',Czechia:'🇨🇿',Canada:'🇨🇦','Bosnia and Herzegovina':'🇧🇦',Qatar:'🇶🇦',Switzerland:'🇨🇭',Brazil:'🇧🇷',Morocco:'🇲🇦',Haiti:'🇭🇹',Scotland:'🏴󠁧󠁢󠁳󠁣󠁴󠁿',USA:'🇺🇸',Paraguay:'🇵🇾',Australia:'🇦🇺','Türkiye':'🇹🇷',Germany:'🇩🇪','Curaçao':'🇨🇼',"Côte d'Ivoire":'🇨🇮',Ecuador:'🇪🇨',Netherlands:'🇳🇱',Japan:'🇯🇵',Sweden:'🇸🇪',Tunisia:'🇹🇳',Belgium:'🇧🇪',Egypt:'🇪🇬','IR Iran':'🇮🇷','New Zealand':'🇳🇿',Spain:'🇪🇸','Cabo Verde':'🇨🇻','Saudi Arabia':'🇸🇦',Uruguay:'🇺🇾',France:'🇫🇷',Senegal:'🇸🇳',Norway:'🇳🇴',Iraq:'🇮🇶',Argentina:'🇦🇷',Algeria:'🇩🇿',Austria:'🇦🇹',Jordan:'🇯🇴',Colombia:'🇨🇴',Portugal:'🇵🇹',Uzbekistan:'🇺🇿','Congo DR':'🇨🇩',England:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',Croatia:'🇭🇷',Ghana:'🇬🇭',Panama:'🇵🇦' }
const fl = (t) => FLAG[t] || ''

const [{ data: parts }, { data: matches }, { data: cfg }] = await Promise.all([
  db.from('participants').select('id, name, nickname, house_number, is_admin').order('name'),
  db.from('matches').select('*').not('group_name','is',null).order('kickoff_utc'),
  db.from('settings').select('value').eq('key','scoring').single(),
])
const s = cfg.value
const mult = (id, r) => (id === 104 ? s.final_multiplier : ({1:1,2:1,3:1,4:2,5:3,6:4,7:5,8:5}[r]))
const sign = (n) => (n > 0 ? 1 : n < 0 ? -1 : 0)
const players = parts.filter((p) => !p.is_admin)

// traer todos los pronósticos paginado
let preds = []
for (let f = 0; ; f += 1000) {
  const { data } = await db.from('predictions').select('participant_id, match_id, home_score, away_score, points').range(f, f + 999)
  if (!data?.length) break; preds.push(...data); if (data.length < 1000) break
}
const predMap = new Map(preds.map((p) => [`${p.participant_id}_${p.match_id}`, p]))

const wb = new Workbook()
const C = { ink:'FF1B1714', gold:'FFFFC22E', green:'FF1B9150', greenL:'FFD7F0DC', yellow:'FFFFF3C4', red:'FFFCE0DC', head:'FF14120F', cream:'FFFBF4E6' }
const border = { top:{style:'thin'}, left:{style:'thin'}, right:{style:'thin'}, bottom:{style:'thin'} }

// ===== HOJA 1: MATRIZ pronósticos x partido =====
const ws = wb.addWorksheet('Pronósticos', { views: [{ state:'frozen', xSplit:1, ySplit:2 }] })
const finished = matches.filter((m) => m.status === 'finished')
const BLUEHD = 'FF2E5AA8'  // azul visible para encabezados de partido
ws.getColumn(1).width = 20
ws.getCell(1,1).value = 'PARTIDO →'
ws.getCell(2,1).value = 'RESULTADO REAL →'
finished.forEach((m, i) => {
  const col = 2 + i
  ws.getColumn(col).width = 12
  const c1 = ws.getCell(1, col); c1.value = `${fl(m.home_team)} ${es(m.home_team)}\n${fl(m.away_team)} ${es(m.away_team)}`
  c1.font={bold:true,size:11,color:{argb:'FFFFFFFF'}}; c1.fill={type:'pattern',pattern:'solid',fgColor:{argb:BLUEHD}}; c1.alignment={horizontal:'center',vertical:'middle',wrapText:true}; c1.border=border
  const c2 = ws.getCell(2, col); c2.value = `${m.home_score} - ${m.away_score}`; c2.font={bold:true,size:14,color:{argb:'FFFFFFFF'}}; c2.fill={type:'pattern',pattern:'solid',fgColor:{argb:C.green}}; c2.alignment={horizontal:'center'}; c2.border=border
})
let col = 2 + finished.length
const colExact=col, col3=col+1, col0=col+2, colPrueba=col+3, totalCol=col+4
const hdr=(c,txt,fill,w)=>{ ws.getColumn(c).width=w; const x=ws.getCell(1,c); x.value=txt; x.font={bold:true,size:11,color:{argb:'FFFFFFFF'}}; x.fill={type:'pattern',pattern:'solid',fgColor:{argb:fill}}; x.alignment={horizontal:'center',vertical:'middle',wrapText:true}; x.border=border; const y=ws.getCell(2,c); y.fill={type:'pattern',pattern:'solid',fgColor:{argb:fill}}; y.border=border }
hdr(colExact,'🎯 EXACTOS\n(5 pts)','FF1B9150',11)
hdr(col3,'✔️ RESULT.\n(3 pts)','FFB8860B',11)
hdr(col0,'❌ FALLÓ\n(0 pts)','FFC12A22',11)
hdr(colPrueba,'PRUEBA\nDE SUMA','FF14120F',18)
hdr(totalCol,'TOTAL\nPTS','FFFFC22E',10)
ws.getCell(2,colPrueba).value='5×ex + 3×res'; ws.getCell(2,colPrueba).font={italic:true,size:9}
ws.getCell(1,1).font={bold:true,size:11,color:{argb:'FFFFFFFF'}}; ws.getCell(1,1).fill={type:'pattern',pattern:'solid',fgColor:{argb:C.head}}; ws.getCell(1,1).alignment={vertical:'middle'}
ws.getCell(2,1).font={bold:true,color:{argb:'FFFFFFFF'}}; ws.getCell(2,1).fill={type:'pattern',pattern:'solid',fgColor:{argb:C.green}}

const tabla = players.map((p) => {
  let total=0, ex=0, re=0, fa=0
  finished.forEach((m) => {
    const pr = predMap.get(`${p.id}_${m.id}`); if (!pr) return
    if (pr.points) total += pr.points
    const exact = pr.home_score===m.home_score && pr.away_score===m.away_score
    const res = sign(pr.home_score-pr.away_score)===sign(m.home_score-m.away_score)
    if (exact) ex++; else if (res) re++; else fa++
  })
  return { p, total, ex, re, fa }
}).sort((a,b)=>b.total-a.total)

tabla.forEach(({ p, total, ex, re, fa }, ri) => {
  const row = 3 + ri
  const nc = ws.getCell(row,1); nc.value = `${p.nickname || p.name} (${p.house_number})`; nc.font={bold:true,size:11}; nc.border=border; nc.fill={type:'pattern',pattern:'solid',fgColor:{argb:C.cream}}
  finished.forEach((m, i) => {
    const cc = 2 + i; const pr = predMap.get(`${p.id}_${m.id}`)
    const cell = ws.getCell(row, cc); cell.border=border; cell.alignment={horizontal:'center'}
    if (!pr) { cell.value='—'; cell.font={color:{argb:'FFAAAAAA'}}; return }
    cell.value = `${pr.home_score}-${pr.away_score}`
    const exact = pr.home_score===m.home_score && pr.away_score===m.away_score
    const res = sign(pr.home_score-pr.away_score)===sign(m.home_score-m.away_score)
    if (exact) { cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:C.greenL}}; cell.font={bold:true,size:14,color:{argb:C.green}} }
    else if (res) { cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:C.yellow}}; cell.font={bold:true,size:12,color:{argb:'FF8A6D00'}} }
    else { cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:C.red}}; cell.font={size:10,color:{argb:'FFC12A22'}} }
  })
  const put=(c,v,fill,fz)=>{ const x=ws.getCell(row,c); x.value=v; x.border=border; x.alignment={horizontal:'center'}; x.font={bold:true,size:fz||11}; if(fill) x.fill={type:'pattern',pattern:'solid',fgColor:{argb:fill}} }
  put(colExact,ex,'FFD7F0DC',13); put(col3,re,'FFFFF3C4',12); put(col0,fa,'FFFCE0DC',11)
  const pc=ws.getCell(row,colPrueba); pc.value=`5×${ex} + 3×${re} = ${ex*5+re*3}`; pc.font={size:10}; pc.border=border; pc.alignment={horizontal:'center'}
  const tc = ws.getCell(row, totalCol); tc.value=total; tc.font={bold:true,size:16,color:{argb:C.ink}}; tc.fill={type:'pattern',pattern:'solid',fgColor:{argb:C.gold}}; tc.alignment={horizontal:'center'}; tc.border=border
})
ws.getRow(1).height = 56
ws.getRow(2).height = 26

// ===== HOJA 2: TABLA simple =====
const ws2 = wb.addWorksheet('Tabla del Cerdo')
;['#','Parcero','Casa','Puntos'].forEach((h,i)=>{ const c=ws2.getCell(1,i+1); c.value=h; c.font={bold:true,color:{argb:'FFFFFFFF'}}; c.fill={type:'pattern',pattern:'solid',fgColor:{argb:C.head}}; c.border=border })
ws2.columns=[{width:6},{width:22},{width:8},{width:10}]
tabla.forEach(({p,total},i)=>{
  const r=2+i
  ws2.getCell(r,1).value=i+1; ws2.getCell(r,2).value=p.nickname||p.name; ws2.getCell(r,3).value=p.house_number; ws2.getCell(r,4).value=total
  for(let c=1;c<=4;c++){ ws2.getCell(r,c).border=border; if(i===0) ws2.getCell(r,c).fill={type:'pattern',pattern:'solid',fgColor:{argb:C.gold}}; if(i===tabla.length-1) ws2.getCell(r,c).fill={type:'pattern',pattern:'solid',fgColor:{argb:C.red}} }
  ws2.getCell(r,4).font={bold:true}
})

// ===== HOJA 3: CALENDARIO restante de grupos =====
const ws3 = wb.addWorksheet('Faltan por jugar')
;['P#','Grupo','Local','Visitante','Fecha (Col)','Estadio'].forEach((h,i)=>{ const c=ws3.getCell(1,i+1); c.value=h; c.font={bold:true,color:{argb:'FFFFFFFF'}}; c.fill={type:'pattern',pattern:'solid',fgColor:{argb:C.head}}; c.border=border })
ws3.columns=[{width:6},{width:8},{width:16},{width:16},{width:26},{width:24}]
const pend = matches.filter((m)=>m.status!=='finished')
pend.forEach((m,i)=>{
  const r=2+i
  const dt=new Date(m.kickoff_utc).toLocaleString('es-CO',{timeZone:'America/Bogota',weekday:'short',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'})
  ;[m.id, m.group_name, `${fl(m.home_team)} ${es(m.home_team)}`, `${fl(m.away_team)} ${es(m.away_team)}`, dt, m.venue].forEach((v,c)=>{ const cell=ws3.getCell(r,c+1); cell.value=v; cell.border=border; if('Colombia'===m.home_team||'Colombia'===m.away_team) cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:C.yellow}} })
})

await wb.xlsx.writeFile('/tmp/pronosticos-polla.xlsx')
console.log('OK · jugados:', finished.length, '· faltan:', pend.length, '· jugadores:', players.length)
