'use client'

import { useMemo, useState, useTransition } from 'react'
import { saveSimulation } from '@/app/simulador/actions'
import {
  EMPTY_SIM, KO, R32, ROUND_OF, THIRD_SLOTS, autoAssignThirds, collisionMatch, resolveBracket, type SimData,
} from '@/lib/bracket'
import { teamFlag, teamShort } from '@/lib/teams'

type Props = {
  groups: Record<string, string[]>             // grupo → 4 equipos
  saved: SimData | null
  picks: { finalist1: string | null; finalist2: string | null; champion: string | null }
}

const GROUPS = 'ABCDEFGHIJKL'.split('')
const RANK_BADGE = ['1º', '2º', '3º']

export default function Simulator({ groups, saved, picks }: Props) {
  const [data, setData] = useState<SimData>(saved ?? EMPTY_SIM)
  const [tab, setTab] = useState<'grupos' | 'llaves' | 'final'>('grupos')
  const [msg, setMsg] = useState('')
  const [pending, startTransition] = useTransition()

  const res = useMemo(() => resolveBracket(data), [data])

  // ---- helpers de estado ----
  const setOrder = (g: string, team: string) => {
    setMsg('')
    setData((d) => {
      const cur = [...(d.order[g] ?? [])]
      const idx = cur.indexOf(team)
      if (idx >= 0) cur.splice(idx, 1)            // des-rankear
      else if (cur.length < 3) cur.push(team)     // siguiente puesto libre
      // si el 3º cambió, limpiar su clasificación/slots
      const thirds = d.thirds.filter((l) => l !== g || cur.length === 3)
      const slots = Object.fromEntries(Object.entries(d.slots).filter(([, v]) => v !== g || cur.length === 3))
      return { ...d, order: { ...d.order, [g]: cur }, thirds, slots }
    })
  }

  const toggleThird = (g: string) => {
    setMsg('')
    setData((d) => {
      if (d.thirds.includes(g)) {
        return { ...d, thirds: d.thirds.filter((x) => x !== g), slots: Object.fromEntries(Object.entries(d.slots).filter(([, v]) => v !== g)) }
      }
      if (d.thirds.length >= 8) return d
      return { ...d, thirds: [...d.thirds, g] }
    })
  }

  const pickWinner = (m: number, team: string) => {
    setMsg('')
    setData((d) => ({ ...d, winners: { ...d.winners, [String(m)]: team } }))
  }

  const setSlot = (key: string, letter: string) => {
    setMsg('')
    setData((d) => {
      const slots = Object.fromEntries(Object.entries(d.slots).filter(([k, v]) => v !== letter || k === key))
      slots[key] = letter
      return { ...d, slots }
    })
  }

  // ---- progreso ----
  const groupsDone = GROUPS.filter((g) => (data.order[g]?.length ?? 0) === 3).length
  const thirdsDone = data.thirds.length === 8
  const slotsDone = Object.keys(THIRD_SLOTS).every((k) => data.slots[k])
  const finalTeams = res.teams[104]
  const champion = res.winners[104]

  // ---- veredicto vs apuestas grandes ----
  const verdict = useMemo(() => {
    const { finalist1: f1, finalist2: f2, champion: ch } = picks
    if (!f1 || !f2 || !finalTeams?.[0] || !finalTeams?.[1]) return null
    const simFinal = [finalTeams[0], finalTeams[1]]
    const apuestaEnFinal = simFinal.includes(f1) && simFinal.includes(f2)
    if (apuestaEnFinal) {
      const chOk = champion === ch
      return {
        ok: true,
        text: chOk
          ? `🔮 ¡VISIONARIO! Tu simulación calca tu apuesta grande: ${teamShort(f1)} vs ${teamShort(f2)} y campeón ${teamShort(ch!)} 👑. Si esto pasa, enmarcamos tu celular.`
          : `✓ Tu final apostada (${teamShort(f1)} vs ${teamShort(f2)}) SÍ se da en esta simulación… pero coronaste a otro 🤔`,
      }
    }
    const cruce = collisionMatch(res, f1, f2)
    if (cruce && cruce !== 104) {
      return { ok: false, text: `😬 OJO: en esta simulación tu final apostada (${teamShort(f1)} vs ${teamShort(f2)}) se cruza ANTES, en ${ROUND_OF[cruce]} (P${cruce}). Esa final no existe en este universo — ajusta los grupos o reza 🙏` }
    }
    const muertos = [f1, f2].filter((t) => !Object.values(res.teams).some((pair) => pair?.includes(t)))
    if (muertos.length) {
      return { ok: false, text: `💀 ${muertos.map((t) => teamShort(t)).join(' y ')} ni siquiera clasifica(n) en tu simulación. Tu apuesta grande te mira con decepción.` }
    }
    return { ok: false, text: `🤷 En esta simulación llegan ${teamShort(finalTeams[0]!)} y ${teamShort(finalTeams[1]!)} a la final — no los de tu apuesta (${teamShort(f1)} vs ${teamShort(f2)}). Sigue intentando, pa' eso es el simulador.` }
  }, [picks, finalTeams, champion, res])

  // ---- UI ----
  const TeamBtn = ({ m, team }: { m: number; team: string | null }) => {
    if (!team) return <div className="flex-1 text-center text-[11px] font-bold py-2" style={{ color: 'var(--muted)' }}>por definir…</div>
    const win = res.winners[m] === team
    return (
      <button
        onClick={() => pickWinner(m, team)}
        className="flex-1 rounded-lg px-1.5 py-1.5 text-[12px] font-extrabold transition min-w-0 truncate"
        style={{
          border: '2px solid var(--ink)',
          background: win ? 'var(--green)' : 'var(--paper)',
          color: win ? '#fff' : 'var(--ink)',
          opacity: res.winners[m] && !win ? 0.45 : 1,
        }}
      >
        {teamFlag(team)} {teamShort(team)} {win && '✓'}
      </button>
    )
  }

  const KOMatch = ({ m }: { m: number }) => {
    const pair = res.teams[m] ?? [null, null]
    return (
      <div className="rounded-xl p-2" style={{ border: '2px solid var(--ink)', background: 'var(--cream)' }}>
        <p className="text-[9px] font-extrabold uppercase mb-1" style={{ color: 'var(--blue)' }}>P{m} · {ROUND_OF[m]}</p>
        <div className="flex items-center gap-1.5">
          <TeamBtn m={m} team={pair[0]} />
          <span className="text-[10px] font-extrabold" style={{ color: 'var(--muted)' }}>vs</span>
          <TeamBtn m={m} team={pair[1]} />
        </div>
        {/* selector de tercero si aplica */}
        {[0, 1].map((side) => {
          const key = `${m}:${side}`
          const allowed = THIRD_SLOTS[key]
          if (!allowed) return null
          const eligible = allowed.filter((l) => data.thirds.includes(l) && (data.order[l]?.length ?? 0) === 3)
          return (
            <select
              key={key}
              className="input mt-1.5 !py-1.5 !text-[11px]"
              value={data.slots[key] ?? ''}
              onChange={(e) => setSlot(key, e.target.value)}
            >
              <option value="">— ¿qué 3º entra aquí? (de {allowed.join('/')}) —</option>
              {eligible.map((l) => (
                <option key={l} value={l}>
                  3º del {l}: {teamShort(data.order[l][2])}{Object.entries(data.slots).some(([k, v]) => v === l && k !== key) ? ' (ya usado)' : ''}
                </option>
              ))}
            </select>
          )
        })}
      </div>
    )
  }

  return (
    <div>
      <div className="seg">
        <button className={tab === 'grupos' ? 'on' : ''} onClick={() => setTab('grupos')}>1·Grupos {groupsDone}/12</button>
        <button className={tab === 'llaves' ? 'on' : ''} onClick={() => setTab('llaves')}>2·Llaves</button>
        <button className={tab === 'final' ? 'on' : ''} onClick={() => setTab('final')}>3·Mi final</button>
      </div>

      {tab === 'grupos' && (
        <div className="px-[18px] space-y-3">
          <p className="text-xs font-bold" style={{ color: 'var(--muted)' }}>
            Toca los equipos en orden: 1º, 2º y el 3º con esperanza. El que quede sin tocar… pa’ la casa 🏠✈️
          </p>
          <div className="grid grid-cols-1 gap-2.5">
            {GROUPS.map((g) => (
              <div key={g} className="card !p-3 flat" style={{ boxShadow: 'none' }}>
                <p className="kicker mb-1.5" style={{ color: 'var(--green)' }}>Grupo {g}{g === 'K' && ' 🇨🇴'}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {(groups[g] ?? []).map((t) => {
                    const rank = data.order[g]?.indexOf(t) ?? -1
                    return (
                      <button
                        key={t}
                        onClick={() => setOrder(g, t)}
                        className="rounded-lg px-2 py-1.5 text-left text-[12px] font-extrabold truncate"
                        style={{
                          border: '2px solid var(--ink)',
                          background: rank === 0 ? 'var(--yellow)' : rank === 1 ? '#cfe8d8' : rank === 2 ? 'var(--cream-2)' : 'var(--paper)',
                          opacity: (data.order[g]?.length ?? 0) >= 3 && rank === -1 ? 0.45 : 1,
                        }}
                      >
                        {rank >= 0 && <b style={{ color: 'var(--red)' }}>{RANK_BADGE[rank]} </b>}
                        {teamFlag(t)} {teamShort(t)}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Terceros que clasifican */}
          <div className="card !p-3">
            <p className="kicker mb-1" style={{ color: 'var(--green)' }}>Los 8 terceros que se cuelan ({data.thirds.length}/8)</p>
            <p className="text-[11px] font-bold mb-2" style={{ color: 'var(--muted)' }}>
              Así de raro es este Mundial: 8 de los 12 terceros también clasifican. Elige cuáles.
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {GROUPS.map((g) => {
                const t = data.order[g]?.[2]
                if (!t) return (
                  <div key={g} className="rounded-lg px-2 py-1.5 text-[11px] font-bold" style={{ border: '2px dashed #d8cdb4', color: 'var(--muted)' }}>
                    3º del {g}: ordena el grupo
                  </div>
                )
                const on = data.thirds.includes(g)
                return (
                  <button
                    key={g}
                    onClick={() => toggleThird(g)}
                    className="rounded-lg px-2 py-1.5 text-left text-[12px] font-extrabold truncate"
                    style={{ border: '2px solid var(--ink)', background: on ? 'var(--green)' : 'var(--paper)', color: on ? '#fff' : 'var(--ink)' }}
                  >
                    {teamFlag(t)} {teamShort(t)} <small>({g})</small>
                  </button>
                )
              })}
            </div>
            {thirdsDone && !slotsDone && (
              <button
                className="savebtn mt-2"
                style={{ background: 'var(--blue)' }}
                onClick={() => {
                  const auto = autoAssignThirds(data.thirds)
                  if (auto) setData((d) => ({ ...d, slots: auto }))
                  else setMsg('Esa combinación de terceros no cuadra en el bracket 🤯 — cambia alguno')
                }}
              >
                🎲 QUE LA GALLINA ACOMODE LOS TERCEROS
              </button>
            )}
          </div>
          {groupsDone === 12 && thirdsDone && (
            <button className="btn green" onClick={() => setTab('llaves')}>SIGUE: LAS LLAVES →</button>
          )}
        </div>
      )}

      {tab === 'llaves' && (
        <div className="px-[18px] space-y-2">
          <p className="text-xs font-bold" style={{ color: 'var(--muted)' }}>
            Toca al ganador de cada llave. El bracket es el REAL de la FIFA: aquí se ve quién se cruza con quién.
          </p>
          {groupsDone < 12 && <p className="text-xs font-extrabold" style={{ color: 'var(--red-d)' }}>⚠️ Te faltan grupos por ordenar (pestaña 1)</p>}
          <p className="kicker" style={{ color: 'var(--green)' }}>Dieciseisavos</p>
          <div className="grid grid-cols-1 gap-2">{Object.keys(R32).map((m) => <KOMatch key={m} m={Number(m)} />)}</div>
          <p className="kicker pt-2" style={{ color: 'var(--green)' }}>Octavos</p>
          <div className="grid grid-cols-1 gap-2">{[89, 90, 91, 92, 93, 94, 95, 96].map((m) => <KOMatch key={m} m={m} />)}</div>
          <p className="kicker pt-2" style={{ color: 'var(--green)' }}>Cuartos</p>
          <div className="grid grid-cols-1 gap-2">{[97, 98, 99, 100].map((m) => <KOMatch key={m} m={m} />)}</div>
          <p className="kicker pt-2" style={{ color: 'var(--green)' }}>Semifinales</p>
          <div className="grid grid-cols-1 gap-2">{[101, 102].map((m) => <KOMatch key={m} m={m} />)}</div>
          {res.winners[101] && res.winners[102] && (
            <button className="btn green" style={{ marginTop: 8 }} onClick={() => setTab('final')}>VER MI FINAL →</button>
          )}
        </div>
      )}

      {tab === 'final' && (
        <div className="px-[18px] space-y-3">
          {!finalTeams?.[0] || !finalTeams?.[1] ? (
            <div className="card text-center">
              <p className="text-3xl mb-2">🔮</p>
              <p className="font-extrabold text-sm">Aún no hay final…</p>
              <p className="text-xs font-bold mt-1" style={{ color: 'var(--muted)' }}>
                Completa los grupos y las llaves. La bola de cristal no trabaja con datos incompletos 😤
              </p>
            </div>
          ) : (
            <>
              <div className="hero" style={{ margin: 0 }}>
                <div className="hp">
                  <div className="tag">🏆 TU FINAL SIMULADA · MetLife Stadium · 19 de julio</div>
                  <div className="vs">
                    <div className="team"><div className="fl">{teamFlag(finalTeams[0])}</div><div className="nm">{teamShort(finalTeams[0])}</div></div>
                    <div className="mid"><div className="x">VS</div></div>
                    <div className="team"><div className="fl">{teamFlag(finalTeams[1])}</div><div className="nm">{teamShort(finalTeams[1])}</div></div>
                  </div>
                  <p className="text-center text-[11px] font-bold pb-1" style={{ color: '#cbbfae' }}>¿Y la copa pa’ quién? Toca al campeón:</p>
                  <div className="flex gap-2 pb-2">
                    {[finalTeams[0], finalTeams[1]].map((t) => (
                      <button
                        key={t}
                        onClick={() => pickWinner(104, t!)}
                        className="flex-1 rounded-xl py-2 text-[13px] font-extrabold"
                        style={{ border: '2.5px solid var(--cream)', background: champion === t ? 'var(--yellow)' : 'transparent', color: champion === t ? 'var(--ink)' : 'var(--cream)' }}
                      >
                        {champion === t && '👑 '}{teamFlag(t!)} {teamShort(t!)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {res.teams[103]?.[0] && res.teams[103]?.[1] && (
                <div className="card !p-3">
                  <p className="kicker mb-1.5" style={{ color: 'var(--green)' }}>🥉 {ROUND_OF[103]} (3er puesto)</p>
                  <div className="flex items-center gap-1.5">
                    <TeamBtn m={103} team={res.teams[103][0]} />
                    <span className="text-[10px] font-extrabold" style={{ color: 'var(--muted)' }}>vs</span>
                    <TeamBtn m={103} team={res.teams[103][1]} />
                  </div>
                </div>
              )}

              {verdict && (
                <div className="castigo" style={{ margin: 0, background: verdict.ok ? 'var(--green)' : 'var(--ink)' }}>
                  <div className="big">{verdict.ok ? '🔮' : '🐔'}</div>
                  <div className="t">{verdict.text}</div>
                </div>
              )}
            </>
          )}

          <button
            className="btn yellow"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const r = await saveSimulation(data)
                setMsg(r?.error ?? '✓ Simulación guardada. El futuro quedó por escrito 🔮')
              })
            }
          >
            {pending ? 'GUARDANDO…' : '💾 GUARDAR MI SIMULACIÓN'}
          </button>
          {msg && <p className="text-center text-sm font-bold" style={{ color: msg.startsWith('✓') ? 'var(--green)' : 'var(--red-d)' }}>{msg}</p>}
        </div>
      )}

      {msg && tab !== 'final' && (
        <p className="text-center text-sm font-bold px-[18px] pt-2" style={{ color: 'var(--red-d)' }}>{msg}</p>
      )}
    </div>
  )
}
