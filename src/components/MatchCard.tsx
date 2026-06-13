'use client'

import { useState, useTransition } from 'react'
import { savePrediction } from '@/app/actions'
import { teamFlag, teamShort } from '@/lib/teams'
import { stadiumOf } from '@/lib/stadiums'

// Banner del estadio: foto con el nombre/ciudad y, si está EN VIVO,
// el marcador + minuto + goleadores sobrepuestos (datos cargados por el admin).
function StadiumBanner({
  venue, live, home, away, homeScore, awayScore, minute, scorers,
}: {
  venue: string | null
  live?: boolean
  home?: string
  away?: string
  homeScore?: number | null
  awayScore?: number | null
  minute?: string | null
  scorers?: string | null
}) {
  const st = stadiumOf(venue)
  if (!st) return null
  const h = live ? (minute ? `${st.nombre} · ${minute}` : st.nombre) : `${st.nombre}`
  return (
    <div className={`relative overflow-hidden ${live ? 'h-[124px]' : 'h-[88px]'}`} style={{ borderBottom: '2.5px solid var(--ink)' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/stadiums/${st.img}.jpg`} alt={st.nombre} loading="lazy" className="w-full h-full object-cover" />
      <div className="absolute inset-0" style={{ background: `linear-gradient(to top, rgba(27,23,20,${live ? '.92' : '.85'}) 0%, rgba(27,23,20,${live ? '.5' : '.15'}) 55%, transparent 100%)` }} />

      {live ? (
        <div className="absolute inset-0 flex flex-col justify-end p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded animate-pulse" style={{ background: 'var(--red)', color: '#fff' }}>🔴 EN VIVO</span>
            {minute && <span className="text-[11px] font-extrabold" style={{ color: 'var(--yellow)' }}>{minute}</span>}
            <span className="text-[10px] font-bold ml-auto truncate" style={{ color: '#cbbfae' }}>{st.pais} {st.nombre}</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <span className="text-[13px] font-extrabold truncate max-w-[34%] text-right" style={{ color: '#fff' }}>{home}</span>
            <span className="display text-2xl px-2 py-0.5 rounded-lg" style={{ background: 'var(--yellow)', color: 'var(--ink)' }}>{homeScore ?? 0} – {awayScore ?? 0}</span>
            <span className="text-[13px] font-extrabold truncate max-w-[34%]" style={{ color: '#fff' }}>{away}</span>
          </div>
          {scorers && <p className="text-[10px] font-bold text-center mt-1 truncate" style={{ color: '#e8dcc8' }}>⚽ {scorers}</p>}
        </div>
      ) : (
        <div className="absolute bottom-1.5 left-2.5 right-2.5">
          <p className="display text-[15px] uppercase leading-none truncate" style={{ color: '#fff' }}>{st.nombre}</p>
          <p className="text-[10px] font-extrabold" style={{ color: 'var(--yellow)' }}>
            {st.pais} {st.ciudad} · 👥 {st.capacidad.toLocaleString('es-CO')} · {st.ano}
          </p>
        </div>
      )}
    </div>
  )
}

// Dato curioso del estadio (desplegable)
function StadiumFact({ venue }: { venue: string | null }) {
  const st = stadiumOf(venue)
  if (!st) return null
  return (
    <details className="px-3 pb-2">
      <summary className="text-[11px] font-extrabold cursor-pointer select-none" style={{ color: 'var(--blue)' }}>
        🏟️ Sobre el estadio
      </summary>
      <p className="text-[11px] font-bold mt-1 leading-snug" style={{ color: 'var(--muted)' }}>
        <b style={{ color: 'var(--ink)' }}>{st.nombre}</b> · {st.pais} {st.ciudad} · 👥 {st.capacidad.toLocaleString('es-CO')} espectadores · inaugurado en {st.ano}.
        <br />💡 {st.dato}
      </p>
    </details>
  )
}

import type { MatchOdds, MatchStats } from '@/lib/db'

// MFito patrullando junto a la bandera (patrocinador MF Group). side: 'l' | 'r'
function Mfito({ side }: { side: 'l' | 'r' }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/mfito-head.png" alt="MFito" className={`mfito-flag ${side === 'r' ? 'r' : ''}`} />
}

// Cuotas 1X2 (formato decimal, como las casas de apuestas). Resalta la favorita.
function OddsRow({ odds, home, away }: { odds: MatchOdds; home: string; away: string }) {
  const min = Math.min(odds.h, odds.d, odds.a)
  const cell = (label: string, val: number) => (
    <div className="flex-1 text-center rounded-lg py-1" style={{ border: '2px solid var(--ink)', background: val === min ? 'var(--yellow)' : 'var(--cream)' }}>
      <div className="text-[9px] font-extrabold uppercase truncate px-0.5" style={{ color: 'var(--muted)' }}>{label}</div>
      <div className="text-[14px] font-extrabold" style={{ color: 'var(--ink)' }}>{val.toFixed(2)}</div>
    </div>
  )
  return (
    <div className="px-3 pb-2">
      <p className="text-[9px] font-extrabold uppercase mb-1" style={{ color: 'var(--blue)' }}>💰 Cuotas {odds.prov} · ⭐ favorito</p>
      <div className="flex gap-1.5">
        {cell(home, odds.h)}
        {cell('Empate', odds.d)}
        {cell(away, odds.a)}
      </div>
    </div>
  )
}

type Props = {
  matchId: number
  home: string
  away: string
  kickoffLabel: string
  venue: string | null
  tv: string
  groupLabel: string
  locked: boolean
  status: 'scheduled' | 'live' | 'finished'
  actualHome: number | null
  actualAway: number | null
  minute: string | null
  scorers: string | null
  stats: MatchStats | null
  odds: MatchOdds | null
  initialHome: number | null
  initialAway: number | null
  points: number | null
  maxExact: number
}

// Estadísticas sabrosas del partido: barras comparativas + asistencia + tarjetas
function StatsBlock({ stats }: { stats: MatchStats }) {
  const keys = Object.keys(stats.home ?? {})
  if (!keys.length && !stats.attendance && !stats.cards) return null
  return (
    <details className="px-3 pb-3">
      <summary className="text-[11px] font-extrabold cursor-pointer select-none" style={{ color: 'var(--blue)' }}>
        📊 Datos del partido
      </summary>
      <div className="mt-2 space-y-1.5">
        {keys.map((k) => {
          const h = parseFloat(stats.home[k]) || 0
          const a = parseFloat(stats.away[k]) || 0
          const tot = h + a || 1
          return (
            <div key={k}>
              <div className="flex justify-between text-[10px] font-extrabold">
                <span>{stats.home[k]}</span>
                <span style={{ color: 'var(--muted)' }}>{k}</span>
                <span>{stats.away[k]}</span>
              </div>
              <div className="flex h-1.5 rounded-full overflow-hidden" style={{ border: '1px solid var(--ink)' }}>
                <div style={{ width: `${(h / tot) * 100}%`, background: 'var(--green)' }} />
                <div style={{ width: `${(a / tot) * 100}%`, background: 'var(--blue)' }} />
              </div>
            </div>
          )
        })}
        {stats.cards && <p className="text-[10px] font-bold pt-1" style={{ color: 'var(--muted)' }}>{stats.cards}</p>}
        {stats.attendance && <p className="text-[10px] font-bold" style={{ color: 'var(--muted)' }}>👥 {stats.attendance.toLocaleString('es-CO')} en el estadio</p>}
      </div>
    </details>
  )
}

function Stepper({ val, set, disabled, label }: { val: number; set: (v: number) => void; disabled: boolean; label: string }) {
  return (
    <div className="stepper">
      <div className="num">{val}</div>
      <div className="ctrls">
        <button type="button" disabled={disabled} aria-label={`Menos goles ${label}`} onClick={() => set(Math.max(0, val - 1))}>−</button>
        <button type="button" disabled={disabled} aria-label={`Más goles ${label}`} onClick={() => set(Math.min(15, val + 1))}>+</button>
      </div>
    </div>
  )
}

export default function MatchCard(p: Props) {
  const [saved, setSaved] = useState<{ home: number; away: number } | null>(
    p.initialHome != null ? { home: p.initialHome, away: p.initialAway ?? 0 } : null
  )
  const [home, setHome] = useState(saved?.home ?? 0)
  const [away, setAway] = useState(saved?.away ?? 0)
  const [editing, setEditing] = useState(saved == null)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const esColombia = p.home === 'Colombia' || p.away === 'Colombia'
  const dirty = !saved || saved.home !== home || saved.away !== away

  function onButton() {
    if (p.locked || pending) return
    if (!editing) {
      setEditing(true)
      setError('')
      return
    }
    startTransition(async () => {
      const res = await savePrediction(p.matchId, home, away)
      if (res?.error) {
        setError(res.error)
      } else {
        setSaved({ home, away })
        setEditing(false)
        setError('')
      }
    })
  }

  // Partido terminado: resultado grande + badge de puntos
  if (p.status === 'finished') {
    const kind = p.points == null ? null : p.points >= p.maxExact ? 'hit' : p.points > 0 ? 'part' : 'miss'
    return (
      <div className="match done fade">
        <StadiumBanner venue={p.venue} />
        <div className="mtop">
          <span className="grp">{p.groupLabel}</span>
          <span>{p.kickoffLabel} · FINAL</span>
        </div>
        <div className="mbody" style={{ paddingBottom: 6 }}>
          <div className="mteam"><div className="fl"><Mfito side="l" /> {teamFlag(p.home)}</div><div className="nm">{teamShort(p.home)}</div></div>
          <div className="resultline"><span className="big">{p.actualHome}</span><span className="scoremid">:</span><span className="big">{p.actualAway}</span></div>
          <div className="mteam"><div className="fl">{teamFlag(p.away)} <Mfito side="r" /></div><div className="nm">{teamShort(p.away)}</div></div>
        </div>
        {p.scorers && (
          <p className="text-center text-[11px] font-bold px-3 pb-1.5" style={{ color: 'var(--muted)' }}>⚽ {p.scorers}</p>
        )}
        {p.stats && <StatsBlock stats={p.stats} />}
        <StadiumFact venue={p.venue} />
        <div className="predbadge">
          <span className="pl">
            {saved ? <>Tu pronóstico: <b>{saved.home}–{saved.away}</b></> : 'No pronosticaste 🫥'}
          </span>
          {kind && (
            <span className={`ptsbadge ${kind}`}>
              {kind === 'hit' ? '¡Exacto!' : kind === 'part' ? 'Acertaste' : 'Falló'} · +{p.points}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`match fade ${p.status === 'live' ? 'live' : esColombia ? 'col' : ''}`}>
      <StadiumBanner
        venue={p.venue}
        live={p.status === 'live'}
        home={teamShort(p.home)}
        away={teamShort(p.away)}
        homeScore={p.actualHome}
        awayScore={p.actualAway}
        minute={p.minute}
        scorers={p.scorers}
      />
      <div className="mtop">
        <span className="grp">{esColombia && '🇨🇴 '}{p.groupLabel}</span>
        <span>{p.status === 'live' ? '🔴 en juego' : p.kickoffLabel}</span>
      </div>
      <div className="mbody">
        <div className="mteam"><div className="fl"><Mfito side="l" /> {teamFlag(p.home)}</div><div className="nm">{teamShort(p.home)}</div></div>
        <div className="flex items-center gap-1">
          <Stepper val={home} set={(v) => { setHome(v); setError('') }} disabled={p.locked || !editing} label={p.home} />
          <span className="scoremid">:</span>
          <Stepper val={away} set={(v) => { setAway(v); setError('') }} disabled={p.locked || !editing} label={p.away} />
        </div>
        <div className="mteam"><div className="fl">{teamFlag(p.away)} <Mfito side="r" /></div><div className="nm">{teamShort(p.away)}</div></div>
      </div>
      <div className="mfoot">
        {p.locked ? (
          <div className="predbadge" style={{ margin: 0 }}>
            <span className="pl">{saved ? <>Tu pronóstico: <b>{saved.home}–{saved.away}</b></> : 'Te cogió la noche 🫥'}</span>
            <span className="ptsbadge" style={{ background: 'var(--cream-2)' }}>🔒</span>
          </div>
        ) : (
          <>
            <button className={`savebtn ${!editing ? 'saved' : ''}`} disabled={pending || (editing && !dirty && !!saved)} onClick={onButton}>
              {pending ? 'Guardando…' : !editing ? '✓ Guardado · editar ✏️' : 'Guardar pronóstico 💾'}
            </button>
            {!editing && saved && (
              <div className="savedline">¡Quedó! {teamShort(p.home)} {saved.home}–{saved.away} {teamShort(p.away)} 🔒 al pitazo</div>
            )}
            {error && <div className="savedline err">{error}</div>}
          </>
        )}
        <p className="text-center text-[10px] font-bold pt-2" style={{ color: 'var(--muted)' }}>
          📺 {p.tv}
        </p>
      </div>
      {p.odds && <OddsRow odds={p.odds} home={teamShort(p.home)} away={teamShort(p.away)} />}
      <StadiumFact venue={p.venue} />
    </div>
  )
}
